// routes/shorts.js
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/list', async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT * FROM TBL_SHORTS ORDER BY CREATED_AT DESC LIMIT 20`);
        res.json({ success: true, shorts: rows });
    } catch (err) {
        console.error("쇼츠 목록 조회 오류:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;