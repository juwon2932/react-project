const express = require('express');
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_KEY = "show-me-the-money";

// 회원가입
router.post("/join", async (req, res) => {
    const { userId, email, password, realName, nickname, region } = req.body;
    try {
        const hashPwd = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO TBL_USER (USER_ID, EMAIL, PASSWORD, REAL_NAME, NICKNAME, PROFILE_IMG, REGION, CREATED_AT, UPDATED_AT) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        await db.query(query, [userId, email, hashPwd, realName, nickname, '', region]);

        res.json({ message: "회원가입 성공!" });
    } catch (err) {
        console.error("회원가입 에러 발생!", err);
        res.status(500).send("서버 오류: 회원가입 실패");
    }
});

// 로그인
router.post("/login", async (req, res) => {
    const { userId, password } = req.body;
    try {
        // ✅ 데이터베이스에서 사용자 정보 조회
        const query = "SELECT USER_ID, EMAIL, PASSWORD, REAL_NAME, NICKNAME, REGION FROM TBL_USER WHERE USER_ID = ?";
        const [user] = await db.query(query, [userId]);

        if (user.length > 0) {
            const isMatch = await bcrypt.compare(password, user[0].PASSWORD);
            if (isMatch) {
                // ✅ JWT 토큰 생성 (닉네임 수정)
                const payload = {
                    userId: user[0].USER_ID,
                    email: user[0].EMAIL,
                    realName: user[0].REAL_NAME,
                    nickname: user[0].NICKNAME,  // ✅ 여기 수정
                    region: user[0].REGION
                };
                const token = jwt.sign(payload, JWT_KEY, { expiresIn: '12h' });

                // ✅ 세션에 실제 사용자 정보 저장
                req.session.user = payload;

                res.json({
                    success: true,
                    message: "로그인 성공!",
                    token: token,
                    user: payload
                });
            } else {
                res.json({ success: false, message: "비밀번호가 일치하지 않습니다." });
            }
        } else {
            res.json({ success: false, message: "존재하지 않는 아이디입니다." });
        }
    } catch (err) {
        console.error("에러 발생!", err);
        res.status(500).send("Server Error");
    }
});



// 로그인 상태 확인
router.get("/info", (req, res) => {
    if (req.session.user) {
        res.json({
            isLogin: true,
            user: req.session.user
        });
    } else {
        res.json({ isLogin: false });
    }
});

// 로그아웃
router.get("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("세션 삭제 안됨");
            res.status(500).send("로그아웃 실패!");
        } else {
            res.clearCookie("connect.sid");
            res.json({ message: "로그아웃 되셨음" });
        }
    });
});

// 아이디 확인
router.get("/check-id/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const [user] = await db.query("SELECT * FROM TBL_USER WHERE USER_ID = ?", [userId]);
        if (user.length > 0) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        console.error("아이디 확인 오류:", err);
        res.status(500).send("서버 오류: 아이디 확인 실패");
    }
});

// 비밀번호 재설정
router.post("/reset-password", async (req, res) => {
    const { userId, newPassword } = req.body;
    try {
        // 비밀번호 암호화
        const hashPwd = await bcrypt.hash(newPassword, 10);

        // 비밀번호 업데이트
        const query = "UPDATE TBL_USER SET PASSWORD = ? WHERE USER_ID = ?";
        const [result] = await db.query(query, [hashPwd, userId]);

        if (result.affectedRows > 0) {
            res.json({ message: "비밀번호 변경 성공!" });
        } else {
            res.json({ message: "비밀번호 변경 실패: 사용자 없음" });
        }
    } catch (err) {
        console.error("비밀번호 변경 오류:", err);
        res.status(500).send("서버 오류: 비밀번호 변경 실패");
    }
});

module.exports = router;
