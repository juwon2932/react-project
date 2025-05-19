// routes/tags.js

const express = require('express');
const db = require('../db');
const router = express.Router();

// 📁 특정 사용자의 태그된 게시물 목록 조회
router.get('/user/:nickname', async (req, res) => {
    try {
        const { nickname } = req.params;
        
        // 사용자 ID 조회
        const userQuery = "SELECT USER_ID FROM TBL_USER WHERE NICKNAME = ?";
        const [userRows] = await db.query(userQuery, [nickname]);
        
        if (userRows.length === 0) {
            console.error("닉네임을 찾을 수 없습니다:", nickname);
            return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
        }

        const userId = userRows[0].USER_ID;
        
        // 태그된 게시물 조회
        const query = `
            SELECT F.FEED_ID, F.TITLE, F.CONTENTS, I.IMG_URL
            FROM TBL_FEED_HASHTAG FH
            JOIN TBL_FEED F ON FH.FEED_ID = F.FEED_ID
            LEFT JOIN TBL_FEED_IMG I ON F.FEED_ID = I.FEED_ID
            WHERE F.USER_ID = ?
            ORDER BY F.CREATED_AT DESC
        `;
        const [rows] = await db.query(query, [userId]);
        
        console.log("조회 결과:", rows);
        
        res.json(rows);
    } catch (err) {
        console.error("사용자 태그된 게시물 조회 오류:", err);
        res.status(500).send("서버 오류: 사용자 태그된 게시물 조회 실패");
    }
});

module.exports = router;
