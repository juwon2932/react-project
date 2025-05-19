import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Box
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MessageIcon from "@mui/icons-material/Message";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const [anchorElNoti, setAnchorElNoti] = useState(null);
  const [anchorElFollow, setAnchorElFollow] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [followings, setFollowings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem('user'));

  // ✅ 알림 목록 가져오기
  const fetchNotifications = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const res = await axios.get("http://localhost:3005/notification/list", { headers });
      if (res.data.success && Array.isArray(res.data.notifications)) {
        setNotifications(res.data.notifications);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      setNotifications([]);
    }
    setLoading(false);
  };

  // ✅ 팔로잉 목록 가져오기
  const fetchFollowings = async () => {
    const userStr = sessionStorage.getItem('user');
    if (!userStr) {
      console.log('⚠️ user 정보가 sessionStorage에 없습니다.');
      setFollowings([]); // 빈 배열로 초기화
      return;
    }

    const user = JSON.parse(userStr);

    if (!user?.userId) {
      console.log('⚠️ user.userId가 없습니다.');
      setFollowings([]);
      return;
    }

    try {
      const res = await axios.get(`http://localhost:3005/follow/following/${user.userId}`);
      console.log("팔로잉 응답:", res.data);
      setFollowings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setFollowings([]);
      console.log("팔로잉 에러:", err);
    }
  };


  // ✅ 마운트 시 불러오기
  useEffect(() => {
    console.log("useEffect 진입!");
    fetchFollowings();
  }, []);

  // ✅ 알림 메뉴 열기/닫기
  const handleOpenNoti = (e) => {
    setAnchorElNoti(e.currentTarget);
    fetchNotifications();
  };
  const handleCloseNoti = () => setAnchorElNoti(null);

  // ✅ 팔로잉 메뉴 열기/닫기
  const handleOpenFollow = (e) => {
    setAnchorElFollow(e.currentTarget);
    fetchFollowings();
  };
  const handleCloseFollow = () => setAnchorElFollow(null);

  // ✅ 알림 클릭시 읽음 처리
  const handleNotificationClick = async (noti) => {
    if (!noti.READ_AT) {
      const token = localStorage.getItem("token");
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      try {
        await axios.post("http://localhost:3005/notification/read", {
          notificationId: noti.NOTIFICATION_ID
        }, { headers });
      } catch (e) { /* 무시 */ }
      fetchNotifications();
    }
    setAnchorElNoti(null);
  };

  // ✅ 메시지 아이콘 클릭시 메시지 페이지 이동
  const handleMessage = (nickname) => {
    navigate(`/messages?user=${nickname}`);
    setAnchorElFollow(null);
  };

  const unreadCount = notifications.filter(n => !n.READ_AT).length;

  return (
    <AppBar position="static" style={{ background: "#fff", color: "#333", boxShadow: 'none' }}>
      <Toolbar>
        {/* 팔로잉 메뉴 */}
        <Box>
          <IconButton
            color="primary"
            onClick={handleOpenFollow}
            size="large"
            sx={{ mr: 1 }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mr: 0.5 }}>
              팔로잉
            </Typography>
            <ExpandMoreIcon />
          </IconButton>
          <Menu
            anchorEl={anchorElFollow}
            open={Boolean(anchorElFollow)}
            onClose={handleCloseFollow}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            {followings.length === 0 && (
              <MenuItem>팔로잉 없음</MenuItem>
            )}
            {followings.map(f => (
              <MenuItem key={f.USER_ID} divider>
                <ListItemAvatar>
                  <Avatar
                    src={f.PROFILE_IMG ? `http://localhost:3005${f.PROFILE_IMG}` : undefined}
                    sx={{ width: 28, height: 28, mr: 1 }}
                  >
                    {f.NICKNAME?.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={f.NICKNAME} />
                <IconButton edge="end" onClick={() => handleMessage(f.NICKNAME)} size="small">
                  <MessageIcon />
                </IconButton>
              </MenuItem>
            ))}
          </Menu>
        </Box>

        {/* 헤더 타이틀/로고 */}
        <Typography
          variant="h6"
          style={{ flexGrow: 1, fontWeight: 700, letterSpacing: 1, userSelect: 'none' }}
        >
        </Typography>

        {/* 알림 */}
        <Badge badgeContent={unreadCount} color="error">
          <IconButton onClick={handleOpenNoti} sx={{ p: 1 }}>
            <NotificationsIcon />
          </IconButton>
        </Badge>
        <Menu
          anchorEl={anchorElNoti}
          open={Boolean(anchorElNoti)}
          onClose={handleCloseNoti}
        >
          {notifications.length === 0 ? (
            <MenuItem key="no-notification">알림이 없습니다.</MenuItem>
          ) : (
            notifications.map((noti) => (
              <MenuItem
                key={noti.NOTIFICATION_ID || noti.id}
                style={{
                  maxWidth: 350,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  display: "block"
                }}
                title={noti.CONTENT}
                onClick={() => handleNotificationClick(noti)}
              >
                {noti.CONTENT}
              </MenuItem>
            ))
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
