import React, { useEffect, useState, useRef } from "react";
import {
    Box,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Typography,
    TextField,
    Button,
    Paper
} from "@mui/material";
import io from "socket.io-client";
import axios from "axios";

const socket = io("http://localhost:3005", { transports: ["websocket"] });

export default function Messages() {
    const [followings, setFollowings] = useState([]);
    const [chatUsers, setChatUsers] = useState([]);
    const [mergedUsers, setMergedUsers] = useState([]); // ✅ 중복 없는 최종 목록
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMsg, setNewMsg] = useState("");
    const [loadingMsg, setLoadingMsg] = useState(false);

    const user = JSON.parse(sessionStorage.getItem("user"));
    const scrollRef = useRef();

    // 1️⃣ 팔로잉 목록 + 채팅상대(기존 채팅) 병합
    useEffect(() => {
        if (!user?.userId) return;

        // 팔로잉 목록
        const fetchFollowings = axios.get(`http://localhost:3005/follow/following/${user.userId}`);
        // 채팅방에 등록된 상대
        const fetchChatUsers = axios.get(`http://localhost:3005/message/chat-users/${user.userId}`);

        Promise.all([fetchFollowings, fetchChatUsers]).then(([fRes, cRes]) => {
            setFollowings(fRes.data || []);
            setChatUsers(cRes.data || []);
            // 병합해서 중복 제거 (USER_ID 기준)
            const temp = [...(fRes.data || []), ...(cRes.data || [])];
            const uniqueUsers = temp.filter(
                (v, i, arr) => arr.findIndex(u => u.USER_ID === v.USER_ID) === i
            );
            setMergedUsers(uniqueUsers);
        });
    }, [user?.userId]);

    // 2️⃣ 소켓 연결 및 실시간 메시지 수신
    useEffect(() => {
        if (!user?.userId) return;
        socket.emit("register", user.userId);

        socket.on("receiveMessage", (msg) => {
            // 현재 보고 있는 채팅방이면 바로 추가
            if (
                selectedUser &&
                (msg.senderId === selectedUser.USER_ID || msg.receiverId === selectedUser.USER_ID)
            ) {
                setMessages(prev => [...prev, msg]);
            }
            // 신규 상대면 대화상대 병합 목록 갱신
            if (!mergedUsers.find(u => u.USER_ID === msg.senderId || u.USER_ID === msg.receiverId)) {
                // 한 번 더 병합 갱신
                axios.get(`http://localhost:3005/message/chat-users/${user.userId}`)
                    .then((res) => {
                        // 새로 들어온 상대를 mergedUsers에 추가
                        const temp = [...mergedUsers, ...(res.data || [])];
                        const uniqueUsers = temp.filter(
                            (v, i, arr) => arr.findIndex(u => u.USER_ID === v.USER_ID) === i
                        );
                        setMergedUsers(uniqueUsers);
                    });
            }
        });

        return () => socket.off("receiveMessage");
        // eslint-disable-next-line
    }, [user?.userId, selectedUser, mergedUsers]);

    // 3️⃣ 대화 상대 선택시: 채팅방 찾기 or 생성 → 메시지 내역 불러오기
    const loadChatMessages = async (chatUser) => {
        setSelectedUser(chatUser);
        setLoadingMsg(true);
        setMessages([]); // 깜빡임 방지

        try {
            // 1. 채팅방 ID 받아오기(있으면 반환, 없으면 생성)
            const res1 = await axios.post("http://localhost:3005/message/find-or-create-room", {
                user1: user.userId,
                user2: chatUser.USER_ID
            });
            const chatId = res1.data.chatId;

            // 2. 메시지 내역 불러오기
            const res2 = await axios.get(`http://localhost:3005/message/chat/${chatId}`);
            setMessages(res2.data);
        } catch (e) {
            setMessages([]);
        }
        setLoadingMsg(false);
    };

    // 4️⃣ 메시지 전송
    const sendMessage = async () => {
        if (!selectedUser || !newMsg.trim()) return;

        // 1. 채팅방 ID 받아오기(존재하지 않으면 생성)
        const res = await axios.post("http://localhost:3005/message/find-or-create-room", {
            user1: user.userId,
            user2: selectedUser.USER_ID
        });
        const chatId = res.data.chatId;

        const msgObj = {
            chatId,
            senderId: user.userId,
            receiverId: selectedUser.USER_ID,
            content: newMsg
        };
        socket.emit("sendMessage", msgObj);
        setMessages(prev => [...prev, msgObj]);
        setNewMsg("");
    };

    // 5️⃣ 스크롤 아래로 자동이동
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    // 6️⃣ 좌측 대화 상대 목록
    return (
        <Box sx={{ display: "flex", height: "80vh", border: "1px solid #ccc", bgcolor: "#f7f7f7" }}>
            {/* 좌측: 대화 상대 */}
            <Box sx={{ width: 260, borderRight: "1px solid #ccc", overflowY: "auto", bgcolor: "#fff" }}>
                <Typography variant="h6" sx={{ p: 2, fontWeight: 700, letterSpacing: 1 }}>
                    대화 상대 목록
                </Typography>
                <List>
                    {mergedUsers.length === 0 && (
                        <Typography sx={{ p: 2 }}>대화 상대가 없습니다.</Typography>
                    )}
                    {mergedUsers.map((f) => (
                        <ListItem
                            button
                            key={f.USER_ID}
                            selected={selectedUser?.USER_ID === f.USER_ID}
                            onClick={() => loadChatMessages(f)}
                            sx={{ cursor: "pointer", borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: "#e3f1fd" } }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    src={f.PROFILE_IMG && f.PROFILE_IMG.trim() !== "" ? `http://localhost:3005${f.PROFILE_IMG}` : undefined}
                                >
                                    {!f.PROFILE_IMG && f.NICKNAME?.charAt(0)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={f.NICKNAME}
                                primaryTypographyProps={{ fontWeight: 600 }}
                            />
                        </ListItem>
                    ))}
                </List>
            </Box>

            {/* 우측: 채팅 */}
            <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2, minWidth: 0 }}>
                {selectedUser ? (
                    <>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                            {selectedUser.NICKNAME} 님과 대화
                        </Typography>
                        <Box
                            ref={scrollRef}
                            sx={{
                                flexGrow: 1,
                                overflowY: "auto",
                                background: "#f6f8fa",
                                p: 2,
                                mb: 2,
                                borderRadius: 2,
                                border: "1px solid #e1e1e1"
                            }}
                        >
                            {loadingMsg ? (
                                <Typography color="text.secondary">불러오는 중...</Typography>
                            ) : messages.length === 0 ? (
                                <Typography color="text.secondary">메시지가 없습니다.</Typography>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMine = msg.senderId === user.userId;
                                    return (
                                        <Box
                                            key={idx}
                                            sx={{
                                                display: "flex",
                                                flexDirection: isMine ? "row-reverse" : "row",
                                                alignItems: "end",
                                                mb: 1.3,
                                            }}
                                        >
                                            <Avatar
                                                src={
                                                    isMine
                                                        ? (user.PROFILE_IMG && user.PROFILE_IMG.trim() !== "" ? `http://localhost:3005${user.PROFILE_IMG}` : undefined)
                                                        : (selectedUser.PROFILE_IMG && selectedUser.PROFILE_IMG.trim() !== "" ? `http://localhost:3005${selectedUser.PROFILE_IMG}` : undefined)
                                                }
                                                sx={{ width: 32, height: 32, ml: isMine ? 1 : 0, mr: isMine ? 0 : 1 }}
                                            >
                                                {(isMine
                                                    ? user.NICKNAME
                                                    : selectedUser.NICKNAME
                                                )?.charAt(0)}
                                            </Avatar>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    maxWidth: 340,
                                                    p: 1.1,
                                                    px: 2,
                                                    borderRadius: 3,
                                                    bgcolor: isMine ? "#cfe9ff" : "#fff",
                                                    color: "#222",
                                                    fontSize: "1.06rem",
                                                    boxShadow: isMine ? "0 2px 8px #d1eaff99" : "0 2px 8px #f0f0f099"
                                                }}
                                            >
                                                {msg.content}
                                            </Paper>
                                        </Box>
                                    );
                                })
                            )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                size="small"
                                placeholder="메시지를 입력하세요"
                                value={newMsg}
                                onChange={e => setNewMsg(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                            />
                            <Button variant="contained" onClick={sendMessage} disabled={!newMsg.trim()}>
                                전송
                            </Button>
                        </Box>
                    </>
                ) : (
                    <Typography sx={{ m: "auto", color: "gray" }}>
                        좌측에서 대화할 상대를 선택하세요
                    </Typography>
                )}
            </Box>
        </Box>
    );
}
