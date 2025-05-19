const express = require('express');
const db = require('../db');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const router = express.Router();
const sanitizeHtml = require("sanitize-html");


const JWT_KEY = "show-me-the-money";

// 📁 JWT 인증 미들웨어
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ success: false, message: "토큰이 필요합니다." });
    }

    try {
        const decoded = jwt.verify(token, JWT_KEY);
        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT 인증 오류:", err);
        res.status(401).json({ success: false, message: "유효하지 않은 토큰입니다." });
    }
};

// 📁 파일 업로드 설정 (미들웨어 선언 후)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.mimetype.startsWith('image')) {
            cb(null, 'uploads/posts/'); // 원래 이미지 업로드 하던 경로 유지
        } else if (file.mimetype.startsWith('video')) {
            cb(null, 'uploads/posts/videos/'); // 비디오만 새로운 경로 추가
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB 제한
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error("지원하지 않는 파일 형식입니다."), false);
    }
});

// 📁 메인 피드 (모든 게시글 조회, 좋아요 포함)
router.get('/list', async (req, res) => {
    let userId = null;

    // ✅ 토큰이 있으면 유저 ID 추출
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, "show-me-the-money");
            userId = decoded.userId;
        } catch (err) {
            console.error("JWT 인증 오류 (피드 조회):", err);
            // 토큰이 잘못된 경우라도 피드는 보여줘야 함
        }
    }

    try {
        const query = `
           SELECT 
                F.FEED_ID, 
                F.USER_ID,  
                F.TITLE, 
                F.CONTENTS, 
                F.VIEWS, 
                (SELECT IMG_URL FROM TBL_FEED_IMG WHERE FEED_ID = F.FEED_ID LIMIT 1) AS IMG_URL, -- 대표이미지 1장
                U.NICKNAME, 
                U.PROFILE_IMG,  
                F.CREATED_AT,
                (SELECT COUNT(*) FROM TBL_LIKE WHERE FEED_ID = F.FEED_ID) AS LIKE_COUNT,
                ${userId ? `(SELECT COUNT(*) FROM TBL_LIKE WHERE FEED_ID = F.FEED_ID AND USER_ID = ?) AS LIKED` : "0 AS LIKED"}
            FROM TBL_FEED F
            LEFT JOIN TBL_USER U ON F.USER_ID = U.USER_ID
            ORDER BY F.CREATED_AT DESC
        `;

        // ✅ 로그인 상태일 때는 좋아요 정보도 포함
        const [rows] = userId ? await db.query(query, [userId]) : await db.query(query);

        res.json({ success: true, posts: rows });
    } catch (err) {
        console.error("메인 피드 조회 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 메인 피드 조회 실패" });
    }
});


// 📁 댓글 조회 (대댓글 포함)
router.get('/comments/:feedId', async (req, res) => {
    const { feedId } = req.params;

    try {
        // 모든 댓글 (일반 댓글 + 대댓글) 조회
        const query = `
            SELECT 
                C.COMMENT_ID, 
                C.PARENT_COMMENT_ID, 
                C.CONTENT, 
                C.CREATED_AT, 
                U.NICKNAME, 
                IFNULL(U.PROFILE_IMG, 'default-profile.png') AS PROFILE_IMG
            FROM TBL_COMMENT C
            JOIN TBL_USER U ON C.USER_ID = U.USER_ID
            WHERE C.FEED_ID = ?
            ORDER BY C.CREATED_AT ASC
        `;
        const [rows] = await db.query(query, [feedId]);

        // 트리 구조로 변환
        const commentMap = {};
        const comments = [];

        // 기본 댓글 (부모가 없는 댓글) 정리
        rows.forEach(comment => {
            comment.replies = [];
            commentMap[comment.COMMENT_ID] = comment;
            if (!comment.PARENT_COMMENT_ID) {
                comments.push(comment);
            }
        });

        // 대댓글 트리 구조 생성
        rows.forEach(comment => {
            if (comment.PARENT_COMMENT_ID) {
                const parent = commentMap[comment.PARENT_COMMENT_ID];
                if (parent) {
                    parent.replies.push(comment);
                }
            }
        });

        res.json({ success: true, comments });
    } catch (err) {
        console.error("댓글 조회 오류:", err);
        res.status(500).json({ success: false, message: "댓글 조회 실패" });
    }
});


// 게시글 업로드
router.post('/upload', verifyToken, upload.array('mediaFiles', 10), async (req, res) => {
    const userId = req.user.userId;
    const { title, content, type } = req.body;

    try {
        if (type === 'SHORTS') {
            const video = req.files.find(f => f.mimetype.startsWith('video'));
            const thumbnail = req.files.find(f => f.mimetype.startsWith('image'));

            if (!video) {
                return res.status(400).json({ success: false, message: "쇼츠 타입은 비디오 파일이 필요합니다." });
            }

            const shortsQuery = `
                INSERT INTO TBL_SHORTS (USER_ID, TITLE, VIDEO_URL, THUMBNAIL_URL, VIEWS)
                VALUES (?, ?, ?, ?, 0)
            `;
            await db.query(shortsQuery, [
                userId,
                title,
                video.filename,
                thumbnail ? thumbnail.filename : null
            ]);
        } else {  // 피드 타입 처리
            const feedQuery = "INSERT INTO TBL_FEED (USER_ID, TITLE, CONTENTS, PROFILE_TYPE, VIEWS) VALUES (?, ?, ?, 'NICK', 0)";
            const [result] = await db.query(feedQuery, [userId, title, content]);
            const feedId = result.insertId;

            for (const file of req.files) {
                if (file.mimetype.startsWith('image')) {
                    const imgQuery = "INSERT INTO TBL_FEED_IMG (FEED_ID, IMG_URL) VALUES (?, ?)";
                    await db.query(imgQuery, [feedId, file.filename]);
                }
            }
        }

        res.json({ success: true, message: "게시글 업로드 성공!" });
    } catch (err) {
        console.error("게시글 업로드 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 게시글 업로드 실패" });
    }
});

router.get('/:feedId/images', async (req, res) => {
    const { feedId } = req.params;
    console.log('이미지 요청 feedId:', feedId); // 추가!
    try {
        const [rows] = await db.query('SELECT IMG_URL FROM TBL_FEED_IMG WHERE FEED_ID = ?', [feedId]);
        console.log('rows:', rows); // 추가!
        if (!rows.length) {
            return res.json({ success: true, images: [] });
        }
        const images = rows.map(row => row.IMG_URL);
        res.json({ success: true, images });
    } catch (err) {
        console.error('feed/:feedId/images 라우트 에러:', err);
        res.status(500).json({ success: false, message: 'DB 오류', error: err });
    }
});

// 게시물 좋아요 토글
router.post('/like', verifyToken, async (req, res) => {
    const { feedId } = req.body;
    const userId = req.user.userId;

    if (!feedId) {
        return res.status(400).json({ success: false, message: "게시글 ID가 필요합니다." });
    }

    try {
        // 이미 좋아요 눌렀는지 체크
        const checkLikeQuery = `
            SELECT * FROM TBL_LIKE 
            WHERE FEED_ID = ? AND USER_ID = ?
        `;
        const [likes] = await db.query(checkLikeQuery, [feedId, userId]);

        if (likes.length > 0) {
            // 이미 좋아요 눌렀으면 취소
            const deleteLikeQuery = `
                DELETE FROM TBL_LIKE 
                WHERE FEED_ID = ? AND USER_ID = ?
            `;
            await db.query(deleteLikeQuery, [feedId, userId]);
        } else {
            // 좋아요 추가
            const addLikeQuery = `
                INSERT INTO TBL_LIKE (FEED_ID, USER_ID, CREATED_AT) 
                VALUES (?, ?, NOW())
            `;
            await db.query(addLikeQuery, [feedId, userId]);

            // [알림 생성] - 본인 게시물에는 알림 X
            const [[feed]] = await db.query(
                "SELECT USER_ID FROM TBL_FEED WHERE FEED_ID = ?", [feedId]
            );
            const [[user]] = await db.query(
                "SELECT NICKNAME FROM TBL_USER WHERE USER_ID = ?", [userId]
            );
            if (feed.USER_ID !== userId) {
                await db.query(
                    `INSERT INTO TBL_NOTIFICATION (USER_ID, TYPE, CONTENT) VALUES (?, 'LIKE', ?)`,
                    [feed.USER_ID, `${user.NICKNAME}님이 게시물에 좋아요를 눌렀습니다.`]
                );
            }
        }

        // 최신 좋아요 개수 반환
        const [likeCount] = await db.query(
            "SELECT COUNT(*) AS LIKE_COUNT FROM TBL_LIKE WHERE FEED_ID = ?",
            [feedId]
        );

        res.json({ success: true, liked: likes.length === 0, likeCount: likeCount[0].LIKE_COUNT });
    } catch (err) {
        console.error("게시물 좋아요 토글 오류:", err);
        res.status(500).json({ success: false, message: "게시물 좋아요 토글 실패" });
    }
});



/// 📁 프로필 이미지 조회 (아이디 기반)
router.get('/profile/:nickname', async (req, res) => {
    const { nickname } = req.params;

    try {
        const [rows] = await db.query(
            "SELECT PROFILE_IMG FROM TBL_USER WHERE NICKNAME = ?",
            [nickname]
        );

        // ✅ 기본 이미지 처리 (절대 경로 수정)
        const profileImg = rows.length > 0 && rows[0].PROFILE_IMG
            ? `uploads/profile/${rows[0].PROFILE_IMG}`
            : `uploads/profile/default-profile.png`;

        // ✅ 파일 전송 (절대 경로)
        res.sendFile(profileImg, { root: __dirname + '/../' });
    } catch (err) {
        console.error("프로필 이미지 조회 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 프로필 이미지 조회 실패" });
    }
});

router.post('/views/:feedId', async (req, res) => {
    const { feedId } = req.params;

    try {
        // ✅ 조회수 증가
        const [result] = await db.query("UPDATE TBL_FEED SET VIEWS = VIEWS + 1 WHERE FEED_ID = ?", [feedId]);

        // ✅ 조회수 증가 확인
        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: "존재하지 않는 게시글입니다." });
        }
    } catch (error) {
        console.error("Error increasing view count:", error);
        res.status(500).json({ success: false, message: "조회수 증가 실패" });
    }
});


// 게시글 수정 (제목, 내용, 이미지 변경)
router.put('/:feedId', verifyToken, upload.single('img'), async (req, res) => {
    try {
        const { feedId } = req.params;
        const userId = req.user.userId;  // JWT에서 추출한 로그인 유저 ID
        const { title, contents } = req.body;
        const imgFile = req.file ? req.file.filename : null;

        // 먼저 게시글 작성자가 맞는지 확인
        const checkQuery = "SELECT USER_ID FROM TBL_FEED WHERE FEED_ID = ?";
        const [rows] = await db.query(checkQuery, [feedId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "게시글이 존재하지 않습니다." });
        }
        if (rows[0].USER_ID !== userId) {
            return res.status(403).json({ success: false, message: "권한이 없습니다." });
        }

        // 수정 쿼리 준비
        let updateQuery = "UPDATE TBL_FEED SET TITLE = ?, CONTENTS = ?";
        const params = [title, contents];

        if (imgFile) {
            updateQuery += ", IMG_URL = ?";
            params.push(imgFile);
        }

        updateQuery += " WHERE FEED_ID = ?";
        params.push(feedId);

        const [result] = await db.query(updateQuery, params);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "게시글 수정 성공", imgUrl: imgFile });
        } else {
            res.json({ success: false, message: "게시글 수정 실패" });
        }
    } catch (err) {
        console.error("게시글 수정 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 게시글 수정 실패" });
    }
});

// 게시글 삭제
router.delete('/:feedId', verifyToken, async (req, res) => {
    try {
        const { feedId } = req.params;
        const userId = req.user.userId;

        // 작성자가 맞는지 체크
        const checkQuery = "SELECT USER_ID FROM TBL_FEED WHERE FEED_ID = ?";
        const [rows] = await db.query(checkQuery, [feedId]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "게시글이 존재하지 않습니다." });
        }
        if (rows[0].USER_ID !== userId) {
            return res.status(403).json({ success: false, message: "권한이 없습니다." });
        }

        // 게시글 삭제 (댓글, 이미지 등 외래키도 CASCADE 설정되어 있으면 같이 삭제됨)
        const deleteQuery = "DELETE FROM TBL_FEED WHERE FEED_ID = ?";
        const [result] = await db.query(deleteQuery, [feedId]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "게시글 삭제 성공" });
        } else {
            res.json({ success: false, message: "게시글 삭제 실패" });
        }
    } catch (err) {
        console.error("게시글 삭제 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 게시글 삭제 실패" });
    }
});

module.exports = router;
