const express = require('express');
const db = require('../db');
const multer = require('multer');
const verifyToken = require('../auth');
const router = express.Router();
const path = require('path');

// 📁 파일 업로드 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/profile');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ✅ 프로필 이미지 조회
router.get('/:nickname/profile', verifyToken, async (req, res) => {
    try {
        const { nickname } = req.params;

        const query = "SELECT PROFILE_IMG FROM TBL_USER WHERE NICKNAME = ?";
        const [userRows] = await db.query(query, [nickname]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
        }

        const profileImg = userRows[0].PROFILE_IMG || 'default-profile.png';
        res.json({ success: true, profileImg });
    } catch (err) {
        console.error("프로필 이미지 조회 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 프로필 이미지 조회 실패" });
    }
});

// 📁 프로필 이미지 업로드 및 정보 수정
router.post('/update-profile', verifyToken, upload.single('profileImg'), async (req, res) => {
    try {
        const { nickname, region, intro } = req.body;
        const userId = req.user.userId;  // ✅ JWT에서 userId 추출
        const profileImg = req.file ? req.file.filename : null;

        console.log("nickname:", nickname);
        console.log("region:", region);
        console.log("intro:", intro);
        console.log("userId:", userId);
        console.log("profileImg:", profileImg);

        let query = "UPDATE TBL_USER SET NICKNAME = ?, REGION = ?, INTRO = ?";
        const params = [nickname, region, intro];

        if (profileImg) {
            query += ", PROFILE_IMG = ?";
            params.push(profileImg);
        }

        query += " WHERE USER_ID = ?";
        params.push(userId);

        const [result] = await db.query(query, params);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "프로필 수정 성공!", profileImg });
        } else {
            res.json({ success: false, message: "프로필 수정 실패!" });
        }
    } catch (err) {
        console.error("프로필 수정 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 프로필 수정 실패" });
    }
});


// ✅ 게시글 조회
router.get('/:nickname/posts', verifyToken, async (req, res) => {
    try {
        const { nickname } = req.params;

        const userQuery = "SELECT USER_ID FROM TBL_USER WHERE NICKNAME = ?";
        const [userRows] = await db.query(userQuery, [nickname]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
        }

        const userId = userRows[0].USER_ID;
        const postQuery = `
            SELECT F.FEED_ID, F.TITLE, F.CONTENTS, I.IMG_URL
            FROM TBL_FEED F
            LEFT JOIN TBL_FEED_IMG I ON F.FEED_ID = I.FEED_ID
            WHERE F.USER_ID = ?
            ORDER BY F.CREATED_AT DESC
        `;
        const [posts] = await db.query(postQuery, [userId]);

        res.json(posts);
    } catch (err) {
        console.error("게시글 조회 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 게시글 조회 실패" });
    }
});

// ✅ 쇼츠 조회
router.get('/:nickname/shorts', verifyToken, async (req, res) => {
    try {
        const { nickname } = req.params;

        const userQuery = "SELECT USER_ID FROM TBL_USER WHERE NICKNAME = ?";
        const [userRows] = await db.query(userQuery, [nickname]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
        }

        const userId = userRows[0].USER_ID;
        const shortsQuery = `
            SELECT S.SHORTS_ID, S.TITLE, S.VIDEO_URL
            FROM TBL_SHORTS S
            WHERE S.USER_ID = ?
            ORDER BY S.CREATED_AT DESC
        `;
        const [shorts] = await db.query(shortsQuery, [userId]);

        res.json(shorts);
    } catch (err) {
        console.error("쇼츠 조회 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 쇼츠 조회 실패" });
    }
});

// 📁 특정 사용자의 태그된 게시물 조회
router.get('/:nickname/tags', async (req, res) => {
    try {
        const { nickname } = req.params;

        const userQuery = "SELECT USER_ID FROM TBL_USER WHERE NICKNAME = ?";
        const [userRows] = await db.query(userQuery, [nickname]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
        }

        const userId = userRows[0].USER_ID;

        const tagsQuery = `
            SELECT F.FEED_ID, F.TITLE, I.IMG_URL
            FROM TBL_FEED_HASHTAG FH
            JOIN TBL_FEED F ON FH.FEED_ID = F.FEED_ID
            LEFT JOIN TBL_FEED_IMG I ON F.FEED_ID = I.FEED_ID
            WHERE F.USER_ID = ?
            ORDER BY F.CREATED_AT DESC
        `;
        const [tags] = await db.query(tagsQuery, [userId]);

        res.json(tags);
    } catch (err) {
        console.error("사용자 태그된 게시물 조회 오류:", err);
        res.status(500).send("서버 오류: 사용자 태그된 게시물 조회 실패");
    }
});

// ✅ 통계 조회
router.get('/:nickname/stats', verifyToken, async (req, res) => {
    try {
        const { nickname } = req.params;

        const userQuery = "SELECT USER_ID FROM TBL_USER WHERE NICKNAME = ?";
        const [userRows] = await db.query(userQuery, [nickname]);

        if (userRows.length === 0) {
            return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
        }

        const userId = userRows[0].USER_ID;
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM TBL_FOLLOW WHERE FOLLOWEE_ID = ?) AS followers,
                (SELECT COUNT(*) FROM TBL_FOLLOW WHERE FOLLOWER_ID = ?) AS followings,
                (SELECT COUNT(*) FROM TBL_FEED WHERE USER_ID = ?) AS posts
        `;
        const [statsRows] = await db.query(statsQuery, [userId, userId, userId]);

        res.json(statsRows[0]);
    } catch (err) {
        console.error("통계 조회 오류:", err);
        res.status(500).json({ success: false, message: "서버 오류: 통계 조회 실패" });
    }
});




module.exports = router;
