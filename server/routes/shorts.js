const express = require('express');
const db = require('../db');
const router = express.Router();

// 📁 특정 사용자의 쇼츠 목록 조회
router.get('/user/:nickname', async (req, res) => {
    try {
        const { nickname } = req.params;
        const query = `
            SELECT S.SHORTS_ID, S.TITLE, S.VIDEO_URL
            FROM TBL_SHORTS S
            JOIN TBL_USER U ON S.USER_ID = U.USER_ID
            WHERE U.NICKNAME = ?
            ORDER BY S.CREATED_AT DESC
        `;
        const [rows] = await db.query(query, [nickname]);
        res.json(rows);
    } catch (err) {
        console.error("사용자 쇼츠 조회 오류:", err);
        res.status(500).send("서버 오류: 사용자 쇼츠 조회 실패");
    }
});

module.exports = router;
