const express = require('express');
const db = require('../db');
const verifyToken = require('../auth'); // ✅ 경로 수정
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

// 📌 팔로우 상태 확인 (JWT 인증 필요)
router.get('/status/:nickname', verifyToken, async (req, res) => {
    const { nickname } = req.params;
    const userId = req.user.userId;

    try {
        // 닉네임으로 사용자 ID 변환
        const followeeId = await getUserIdFromNickname(nickname);

        if (!followeeId) {
            return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });
        }

        const [rows] = await db.query(
            "SELECT * FROM TBL_FOLLOW WHERE FOLLOWER_ID = ? AND FOLLOWEE_ID = ?",
            [userId, followeeId]
        );

        res.json({ success: true, isFollowing: rows.length > 0 });
    } catch (error) {
        console.error("Error checking follow status:", error);
        res.status(500).json({ success: false, message: "팔로우 상태 조회 실패" });
    }
});

// 📌 팔로우 하기
router.post('/follow/:nickname', verifyToken, async (req, res) => {
    const { nickname } = req.params;
    const userId = req.user.userId;

    try {
        // 닉네임으로 사용자 ID 변환
        const followeeId = await getUserIdFromNickname(nickname);

        if (!followeeId) {
            return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });
        }

        // 팔로우 추가
        await db.query(
            "INSERT INTO TBL_FOLLOW (FOLLOWER_ID, FOLLOWEE_ID) VALUES (?, ?)",
            [userId, followeeId]
        );

        // [알림 추가] - 본인 팔로우 X
        const [[user]] = await db.query(
            "SELECT NICKNAME FROM TBL_USER WHERE USER_ID = ?", [userId]
        );
        if (followeeId !== userId) {
            await db.query(
                `INSERT INTO TBL_NOTIFICATION (USER_ID, TYPE, CONTENT) VALUES (?, 'FOLLOW', ?)`,
                [followeeId, `${user.NICKNAME}님이 팔로우하였습니다.`]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Error following user:", error);
        res.status(500).json({ success: false, message: "팔로우 실패" });
    }
});

// 📌 언팔로우 하기
router.post('/unfollow/:nickname', verifyToken, async (req, res) => {
    const { nickname } = req.params;
    const userId = req.user.userId;

    try {
        // 닉네임으로 사용자 ID 변환
        const followeeId = await getUserIdFromNickname(nickname);

        if (!followeeId) {
            return res.status(404).json({ success: false, message: "유저를 찾을 수 없습니다." });
        }

        // 팔로우 삭제
        await db.query(
            "DELETE FROM TBL_FOLLOW WHERE FOLLOWER_ID = ? AND FOLLOWEE_ID = ?",
            [userId, followeeId]
        );

        res.json({ success: true });
    } catch (error) {
        console.error("Error unfollowing user:", error);
        res.status(500).json({ success: false, message: "언팔로우 실패" });
    }
});

// 팔로잉 목록 조회
router.get('/following/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log('팔로우 쿼리 userId:', userId);
    try {
        const [rows] = await db.query(
            `SELECT u.USER_ID, u.NICKNAME, u.PROFILE_IMG
       FROM TBL_FOLLOW f
       JOIN TBL_USER u ON f.FOLLOWEE_ID = u.USER_ID
       WHERE f.FOLLOWER_ID = ?`,
            [userId]
        );
        console.log('팔로우 쿼리 결과:', rows);
        res.json(rows);
    } catch (err) {
        console.error('팔로우 쿼리 에러:', err);
        res.status(500).json({ message: '서버 오류 발생' });
    }
});

module.exports = router;
