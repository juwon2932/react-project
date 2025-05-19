const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// 📌 닉네임을 USER_ID로 변환하는 함수
const getUserIdFromNickname = async (nickname) => {
    try {
        const [rows] = await db.query("SELECT USER_ID FROM TBL_USER WHERE NICKNAME = ?", [nickname]);
        return rows.length > 0 ? rows[0].USER_ID : null;
    } catch (error) {
        console.error("Error fetching user ID from nickname:", error);
        return null;
    }
};

// 📁 JWT 인증 미들웨어
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "토큰이 필요합니다." });
    }

    try {
        const decoded = jwt.verify(token, "show-me-the-money");
        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT 인증 오류:", err);
        res.status(401).json({ success: false, message: "유효하지 않은 토큰입니다." });
    }
};

// 📁 댓글 조회 (비로그인 허용)
router.get('/:feedId', async (req, res) => {
    const { feedId } = req.params;
    let userId = null;

    // ✅ 토큰이 있는 경우 유저 ID 가져오기
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, "show-me-the-money");
            userId = decoded.userId;
        } catch (err) {
            console.error("JWT 인증 오류 (댓글 조회):", err);
        }
    }

    try {
        const query = `
            SELECT 
                C.COMMENT_ID,
                C.PARENT_COMMENT_ID,
                C.CONTENT,
                U.NICKNAME,
                U.PROFILE_IMG,
                C.CREATED_AT,
                (SELECT COUNT(*) FROM TBL_COMMENT_LIKE WHERE COMMENT_ID = C.COMMENT_ID) AS LIKE_COUNT,
                ${userId ? `(SELECT COUNT(*) FROM TBL_COMMENT_LIKE WHERE COMMENT_ID = C.COMMENT_ID AND USER_ID = ?) AS LIKED` : "0 AS LIKED"}
            FROM TBL_COMMENT C
            JOIN TBL_USER U ON C.USER_ID = U.USER_ID
            WHERE C.FEED_ID = ?
            ORDER BY COALESCE(C.PARENT_COMMENT_ID, C.COMMENT_ID), C.CREATED_AT
        `;

        const [rows] = userId ? await db.query(query, [userId, feedId]) : await db.query(query, [feedId]);

        // 🗂️ 대댓글 구조로 변환
        const commentTree = [];
        const commentMap = {};

        rows.forEach(comment => {
            comment.liked = !!comment.LIKED;
            comment.replies = [];
            commentMap[comment.COMMENT_ID] = comment;

            if (comment.PARENT_COMMENT_ID) {
                const parentComment = commentMap[comment.PARENT_COMMENT_ID];
                if (parentComment) {
                    parentComment.replies.push(comment);
                }
            } else {
                commentTree.push(comment);
            }
        });

        res.json({ success: true, comments: commentTree });
    } catch (err) {
        console.error("댓글 조회 오류:", err);
        res.status(500).json({ success: false, message: "댓글 조회 실패" });
    }
});




// 📁 댓글 및 대댓글 등록
router.post('/', verifyToken, async (req, res) => {
    const { feedId, content, parentCommentId } = req.body;
    const userId = req.user.userId;

    if (!content || !feedId) {
        return res.status(400).json({ success: false, message: "댓글 내용과 게시글 ID가 필요합니다." });
    }

    try {
        // 댓글 등록
        const query = `
            INSERT INTO TBL_COMMENT (FEED_ID, USER_ID, CONTENT, PARENT_COMMENT_ID, CREATED_AT)
            VALUES (?, ?, ?, ?, NOW())
        `;
        await db.query(query, [feedId, userId, content, parentCommentId || null]);

        // 1. 게시글 주인에게 "댓글 알림" (본인 댓글이면 X)
        // 게시글 주인 찾기
        const [[feedOwner]] = await db.query(
            "SELECT USER_ID FROM TBL_FEED WHERE FEED_ID = ?",
            [feedId]
        );
        // 내 닉네임 찾기 (알림 메시지에 사용)
        const [[me]] = await db.query(
            "SELECT NICKNAME FROM TBL_USER WHERE USER_ID = ?",
            [userId]
        );
        if (feedOwner && feedOwner.USER_ID !== userId) {
            await db.query(
                `INSERT INTO TBL_NOTIFICATION (USER_ID, TYPE, CONTENT) VALUES (?, 'COMMENT', ?)`,
                [feedOwner.USER_ID, `${me.NICKNAME}님이 게시물에 댓글을 달았습니다.`]
            );
        }

        // 2. 대댓글이면, 부모 댓글 주인에게 "답글 알림" (본인, 게시글주인 제외)
        if (parentCommentId) {
            const [[parentComment]] = await db.query(
                "SELECT USER_ID FROM TBL_COMMENT WHERE COMMENT_ID = ?",
                [parentCommentId]
            );
            if (
                parentComment
                && parentComment.USER_ID !== userId
                && parentComment.USER_ID !== (feedOwner ? feedOwner.USER_ID : null)
            ) {
                await db.query(
                    `INSERT INTO TBL_NOTIFICATION (USER_ID, TYPE, CONTENT) VALUES (?, 'REPLY', ?)`,
                    [parentComment.USER_ID, `${me.NICKNAME}님이 내 댓글에 답글을 달았습니다.`]
                );
            }
        }

        res.json({ success: true, message: "댓글 등록 성공!" });
    } catch (err) {
        console.error("댓글 등록 오류:", err);
        res.status(500).json({ success: false, message: "댓글 등록 실패" });
    }
});


// 📁 댓글 좋아요 토글
router.post('/like', verifyToken, async (req, res) => {
    const { commentId } = req.body;
    const userId = req.user.userId;

    if (!commentId) {
        return res.status(400).json({ success: false, message: "댓글 ID가 필요합니다." });
    }

    try {
        // ✅ 이미 좋아요 눌렀는지 체크
        const checkLikeQuery = `
            SELECT * FROM TBL_COMMENT_LIKE 
            WHERE COMMENT_ID = ? AND USER_ID = ?
        `;
        const [likes] = await db.query(checkLikeQuery, [commentId, userId]);

        if (likes.length > 0) {
            // ✅ 취소 권한 체크 (본인만 취소 가능)
            if (likes[0].USER_ID !== userId) {
                return res.status(403).json({ success: false, message: "권한이 없습니다." });
            }

            // ✅ 이미 좋아요 눌렀으면 취소
            const deleteLikeQuery = `
                DELETE FROM TBL_COMMENT_LIKE 
                WHERE COMMENT_ID = ? AND USER_ID = ?
            `;
            await db.query(deleteLikeQuery, [commentId, userId]);
        } else {
            // ✅ 좋아요 추가
            const addLikeQuery = `
                INSERT INTO TBL_COMMENT_LIKE (COMMENT_ID, USER_ID, CREATED_AT) 
                VALUES (?, ?, NOW())
            `;
            await db.query(addLikeQuery, [commentId, userId]);
        }

        // ✅ 최신 좋아요 개수 반환
        const [likeCount] = await db.query(
            "SELECT COUNT(*) AS LIKE_COUNT FROM TBL_COMMENT_LIKE WHERE COMMENT_ID = ?",
            [commentId]
        );

        res.json({ success: true, liked: likes.length === 0, likeCount: likeCount[0].LIKE_COUNT });
    } catch (err) {
        console.error("댓글 좋아요 토글 오류:", err);
        res.status(500).json({ success: false, message: "댓글 좋아요 토글 실패" });
    }
});


module.exports = router;
