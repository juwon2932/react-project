const express = require('express');
const db = require('./db');
const userRouter = require('./routes/user');
const feedRouter = require('./routes/feed');
const shortsRouter = require('./routes/shorts');
const tagsRouter = require('./routes/tags');
const mypageRouter = require('./routes/mypage');
const commentsRouter = require('./routes/comments');
const followRouter = require('./routes/follow');
const notificationRouter = require('./routes/notification');
const messageRouter = require('./routes/message');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"]
    }
});

app.use(express.json());

app.use('/uploads', express.static(__dirname + '/uploads'));
// 📁 정적 파일 설정
app.use('/uploads/profile', express.static(path.join(__dirname, 'uploads/profile')));
app.use('/uploads/posts', express.static(path.join(__dirname, 'uploads/posts')));
app.use('/uploads/shorts', express.static(path.join(__dirname, 'uploads/vidoes')));

// 📁 CORS 설정 (필요한 도메인만 허용)
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// 📁 세션 설정
app.use(session({
    secret: 'test1234',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 1000 * 60 * 30 // 30분 세션 만료
    }
}));

// 📁 폴더 생성 (자동 생성)
const uploadDirs = ['uploads/profile', 'uploads/posts', 'uploads/shorts'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 폴더 생성 완료: ${dir}`);
    }
});

// 📁 라우터 연결
app.use("/user", userRouter);
app.use("/feed", feedRouter);
app.use("/shorts", shortsRouter);
app.use("/tags", tagsRouter);
app.use("/mypage", mypageRouter);
app.use("/comments", commentsRouter);
app.use("/follow", followRouter);
app.use('/notification', notificationRouter);
app.use('/message', messageRouter);

// 📁 기본 라우트
app.get("/", (req, res) => {
    res.send("Echo SNS 서버입니다.");
});

// ========== Socket.IO (메시지, 실시간 알림) ==========
io.on('connection', (socket) => {
    console.log('✅ 소켓 연결:', socket.id);

    // 유저가 로그인 시 userId로 join(방 입장)
    socket.on('register', (userId) => {
        socket.join(userId);
        // console.log(`${userId} 방 입장`);
    });

    // 메시지 전송
    socket.on('sendMessage', async (data) => {
        // data: { chatId, senderId, receiverId, content }
        try {
            // 1. DB 저장
            await db.promise().query(
                `INSERT INTO TBL_MESSAGE (CHAT_ID, SENDER_ID, CONTENT) VALUES (?, ?, ?)`,
                [data.chatId, data.senderId, data.content]
            );
            // 2. 알림 DB 저장
            await db.promise().query(
                `INSERT INTO TBL_NOTIFICATION (USER_ID, TYPE, CONTENT) VALUES (?, 'MESSAGE', ?)`,
                [data.receiverId, `${data.senderId}님이 메세지를 보냈습니다.`]
            );
            // 3. 상대에게 실시간 전송
            io.to(data.receiverId).emit('receiveMessage', data);
            io.to(data.receiverId).emit('newNotification', {
                type: "MESSAGE",
                content: `${data.senderId}님이 메세지를 보냈습니다.`
            });
        } catch (err) {
            console.error("메시지/알림 저장 오류:", err);
        }
    });

    // 기타 실시간 알림 (예: 좋아요, 댓글 등도 이런 식으로 확장 가능)
    // socket.on('sendNotification', (notiData) => {
    //     io.to(notiData.targetUserId).emit('newNotification', notiData);
    // });
});

server.listen(3005, () => {
    console.log("🚀 서버 실행 중! 포트: 3005");
});
