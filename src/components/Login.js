import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Link, Stack, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import PasswordReset from './PasswordReset';
import axios from 'axios';

function Login() {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMessage, setDialogMessage] = useState('');
    const [resetOpen, setResetOpen] = useState(false);
    const navigate = useNavigate();

    // ✅ 로그인 요청
    const handleLogin = async () => {
        if (userId.trim().length === 0 || password.trim().length === 0) {
            setDialogMessage('아이디와 비밀번호를 입력하세요.');
            setDialogOpen(true);
            return;
        }

        try {
            const response = await axios.post('http://localhost:3005/user/login', {
                userId,
                password
            });

            // ✅ 로그인 성공
            if (response.data.success) {
                const token = response.data.token;
                localStorage.setItem("token", token);

                // ✅ JWT에서 userId 추출 (닉네임이 아닌 진짜 userId)
                const decodedPayload = JSON.parse(atob(token.split(".")[1]));
                const userIdFromToken = decodedPayload.userId;
                localStorage.setItem("userId", userIdFromToken);

                // ✅ 사용자 정보 저장 (세션 스토리지)
                const userData = response.data.user;
                sessionStorage.setItem('user', JSON.stringify(userData));

                // ✅ 피드 페이지로 이동
                navigate('/feed');
            } else {
                // 로그인 실패 메시지
                setDialogMessage(response.data.message || '로그인 실패');
                setDialogOpen(true);
            }

        } catch (error) {
            console.error('로그인 에러:', error);
            setDialogMessage('서버 오류: 로그인 실패');
            setDialogOpen(true);
        }
    };

    // 다이얼로그 닫기
    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    return (
        <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
            <RouterLink
                to="/feed"
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '30px',
                    textDecoration: 'none'
                }}
            >
                <img src="/img/small-logo.png" alt="Echo Small Logo" style={{ width: '100px', cursor: 'pointer' }} />
            </RouterLink>

            <Box sx={{ width: '100%' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, marginBottom: '30px', color: '#333', textAlign: 'center' }}>
                    로그인
                </Typography>

                <TextField
                    label="아이디"
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    sx={{ marginBottom: '20px' }}
                />
                <TextField
                    label="비밀번호"
                    fullWidth
                    variant="outlined"
                    margin="normal"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ marginBottom: '30px' }}
                />

                <Button
                    variant="contained"
                    fullWidth
                    sx={{
                        backgroundColor: '#777777',
                        color: '#ffffff',
                        padding: '15px 20px',
                        fontWeight: 600,
                        borderRadius: '10px',
                        transition: 'background-color 0.3s',
                        '&:hover': { backgroundColor: '#000000' }
                    }}
                    onClick={handleLogin}  // ✅ 매개변수 없이 직접 호출
                >
                    로그인
                </Button>

                <Stack direction="row" justifyContent="space-between" sx={{ marginTop: '20px', color: '#555' }}>
                    <Link href="/join" sx={{ color: '#777777', fontWeight: 'bold', textDecoration: 'none', transition: 'color 0.3s', '&:hover': { color: '#111' } }}>
                        회원가입
                    </Link>
                    <Link
                        onClick={() => setResetOpen(true)}
                        sx={{
                            color: '#777777',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.3s',
                            '&:hover': { color: '#111' }
                        }}
                    >
                        비밀번호 찾기
                    </Link>
                </Stack>
            </Box>

            {/* 로그인 결과 다이얼로그 */}
            <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth maxWidth="sm">
                <DialogTitle>알림</DialogTitle>
                <DialogContent>
                    <Typography>{dialogMessage}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>확인</Button>
                </DialogActions>
            </Dialog>

            {/* 비밀번호 찾기 모달 */}
            <PasswordReset open={resetOpen} onClose={() => setResetOpen(false)} />
        </Container>
    );
}

export default Login;
