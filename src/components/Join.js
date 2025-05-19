import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Alert
} from '@mui/material';
import axios from 'axios';

function Join() {
    const [userId, setUserId] = useState('');
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const isValidPhone = (phone) => /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (userId.trim().length < 4 || userId.trim().length > 20) {
            setErrorMessage('아이디는 4~20글자 사이여야 합니다.');
            return;
        }

        if (name.trim().length < 2) {
            setErrorMessage('이름은 최소 2글자 이상이어야 합니다.');
            return;
        }

        if (nickname.trim().length < 2 || nickname.trim().length > 20) {
            setErrorMessage('닉네임은 2~20글자 사이여야 합니다.');
            return;
        }

        if (!isValidPhone(phone)) {
            setErrorMessage('유효한 휴대폰 번호를 입력하세요.');
            return;
        }

        if (!isValidEmail(email)) {
            setErrorMessage('유효한 이메일 주소를 입력하세요.');
            return;
        }

        if (password.length < 6) {
            setErrorMessage('비밀번호는 최소 6자리 이상이어야 합니다.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:3005/user/join', {
                userId,
                email,
                password,
                realName: name,
                nickname,
                phone,
                region: '임시 지역'
            });

            if (response.data.message === '회원가입 성공!') {
                alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
                navigate('/login');
            } else {
                setErrorMessage(response.data.message || '회원가입에 실패했습니다.');
            }

        } catch (error) {
            console.error(error);
            setErrorMessage('서버 에러: 회원가입 실패');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', position: 'relative' }}>
            <RouterLink
                to="/feed"
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '-200px',
                    textDecoration: 'none'
                }}
            >
                <img src="/img/small-logo.png" alt="Echo Small Logo" style={{ width: '100px', cursor: 'pointer' }} />
            </RouterLink>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
                <img src="/img/logo.png" alt="Echo Logo" style={{ width: '300px', maxWidth: '80%', padding: '40px' }} />
            </Box>
            <Box sx={{ flex: 1, padding: '60px 40px', backgroundColor: 'transparent' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, marginBottom: '30px', color: '#333', letterSpacing: '0.02em' }}>
                    회원가입
                </Typography>
                {errorMessage && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{errorMessage}</Alert>}
                <TextField label="아이디" variant="outlined" fullWidth margin="normal" value={userId} onChange={(e) => setUserId(e.target.value)} sx={{ marginBottom: '20px' }} />
                <TextField label="이름" variant="outlined" fullWidth margin="normal" value={name} onChange={(e) => setName(e.target.value)} sx={{ marginBottom: '20px' }} />
                <TextField label="닉네임" variant="outlined" fullWidth margin="normal" value={nickname} onChange={(e) => setNickname(e.target.value)} sx={{ marginBottom: '20px' }} />
                <TextField label="휴대폰 번호 (010-1234-5678)" variant="outlined" fullWidth margin="normal" value={phone} onChange={(e) => setPhone(e.target.value)} sx={{ marginBottom: '20px' }} />
                <TextField label="이메일" variant="outlined" fullWidth margin="normal" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ marginBottom: '20px' }} />
                <TextField label="비밀번호" variant="outlined" fullWidth margin="normal" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ marginBottom: '20px' }} />
                <TextField label="비밀번호 확인" variant="outlined" fullWidth margin="normal" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} sx={{ marginBottom: '30px' }} />
                <Button variant="contained" fullWidth sx={{ backgroundColor: '#777777', color: '#ffffff', padding: '15px 20px', fontWeight: 600, borderRadius: '10px', transition: 'background-color 0.3s', '&:hover': { backgroundColor: '#000000' } }} onClick={handleSubmit}>회원가입</Button>
            </Box>
        </Container>
    );
}

export default Join;
