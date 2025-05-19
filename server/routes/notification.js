const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../auth');

// 알림 목록 조회
router.get('/list', verifyToken, async (req, res) => {
    const { userId } = req.user;
    const [rows] = await db.query(
        `SELECT * FROM TBL_NOTIFICATION WHERE USER_ID=? ORDER BY CREATED_AT DESC LIMIT 30`,
        [userId]
    );
    res.json({ success: true, notifications: rows });
});

// 읽음 처리
router.post('/read', verifyToken, async (req, res) => {
    const { notificationId } = req.body;
    await db.query(
        `UPDATE TBL_NOTIFICATION SET READ_AT=NOW() WHERE NOTIFICATION_ID=?`,
        [notificationId]
    );
    res.json({ success: true });
});

module.exports = router;
