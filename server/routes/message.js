const express = require('express');
const db = require('../db');
const router = express.Router();

/**
 * 1️⃣ 채팅방 자동 생성(중복X) 및 chatId 반환
 * POST /message/find-or-create-room
 * body: { user1, user2 }
 */
router.post('/find-or-create-room', async (req, res) => {
    const { user1, user2 } = req.body;
    if (!user1 || !user2) return res.status(400).json({ error: 'user1, user2 필수' });

    try {
        // 항상 user1 < user2 (중복방지)
        const [u1, u2] = [user1, user2].sort();

        // 1. 기존 채팅방 조회
        const [rows] = await db.query(
            `SELECT CHAT_ID FROM TBL_CHAT WHERE (USER_1=? AND USER_2=?) OR (USER_1=? AND USER_2=?) LIMIT 1`,
            [u1, u2, u2, u1]
        );
        if (rows.length > 0) {
            return res.json({ chatId: rows[0].CHAT_ID });
        }

        // 2. 없으면 채팅방 생성
        const [result] = await db.query(
            `INSERT INTO TBL_CHAT (USER_1, USER_2) VALUES (?, ?)`,
            [u1, u2]
        );
        res.json({ chatId: result.insertId });
    } catch (err) {
        console.error("채팅방 생성/조회 오류:", err);
        res.status(500).json({ error: 'DB 오류' });
    }
});

/**
 * 2️⃣ 메시지 저장 (REST용/실시간용)
 * POST /message/send
 * body: { chatId, senderId, receiverId, content }
 */
router.post('/send', async (req, res) => {
    const { chatId, senderId, receiverId, content } = req.body;
    if (!chatId || !senderId || !receiverId || !content) return res.status(400).json({ error: '모든 필드 필수' });
    try {
        await db.query(
            `INSERT INTO TBL_MESSAGE (CHAT_ID, SENDER_ID, CONTENT) VALUES (?, ?, ?)`,
            [chatId, senderId, content]
        );
        await db.query(
            `INSERT INTO TBL_NOTIFICATION (USER_ID, TYPE, CONTENT) VALUES (?, 'MESSAGE', ?)`,
            [receiverId, `${senderId}님으로부터 메시지가 도착했습니다.`]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("메시지 저장 오류:", err);
        res.status(500).json({ success: false });
    }
});

/**
 * 3️⃣ 메시지 내역 불러오기
 * GET /message/chat/:chatId
 */
router.get('/chat/:chatId', async (req, res) => {
    const { chatId } = req.params;
    try {
        const [messages] = await db.query(
            `SELECT * FROM TBL_MESSAGE WHERE CHAT_ID = ? ORDER BY CREATED_AT ASC`,
            [chatId]
        );
        res.json(messages);
    } catch (err) {
        console.error("메시지 불러오기 오류:", err);
        res.status(500).json([]);
    }
});

/**
 * 4️⃣ 대화 상대 목록(참여중인 모든 채팅 상대)
 * GET /message/chat-users/:userId
 */
router.get('/chat-users/:userId', async (req, res) => {
    const { userId } = req.params;
    console.log("[chat-users] userId =", userId);
    try {
        // 내 채팅방들 찾고 상대방 프로필 불러오기
        const [rows] = await db.query(`
            SELECT 
                CASE WHEN USER_1=? THEN USER_2 ELSE USER_1 END AS USER_ID
            FROM TBL_CHAT
            WHERE USER_1=? OR USER_2=?
        `, [userId, userId, userId]);

        if (rows.length === 0) return res.json([]);
        const userIds = rows.map(r => r.USER_ID);

        if (userIds.length === 0) return res.json([]);

        // 유저 프로필 정보로 변환
        const [users] = await db.query(
            `SELECT USER_ID, NICKNAME, PROFILE_IMG FROM TBL_USER WHERE USER_ID IN (${userIds.map(() => '?').join(',')})`,
            userIds
        );
        res.json(users);
    } catch (err) {
        console.error("채팅 상대 불러오기 오류:", err);
        res.status(500).json([]);
    }
});

module.exports = router;
