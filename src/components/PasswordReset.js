import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack, Typography } from '@mui/material';
import axios from 'axios';

function PasswordReset({ open, onClose }) {
    const [userId, setUserId] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showPhone, setShowPhone] = useState(false);
    const [showCode, setShowCode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    // 초기화
    const resetAll = () => {
        setUserId('');
        setPhone('');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMessage('');
        setShowPhone(false);
        setShowCode(false);
        setShowPassword(false);
        setIsVerified(false);
    };

    // 취소 버튼
    const handleClose = () => {
        resetAll();
        onClose();
    };

    // 아이디 확인
    const handleCheckUserId = () => {
        if (!userId.trim()) {
            setErrorMessage('아이디를 입력하세요.');
            return;
        }

        axios.get(`http://localhost:3005/user/check-id/${userId}`)
            .then((response) => {
                if (response.data.exists) {
                    setShowPhone(true);
                    setErrorMessage('');
                } else {
                    setErrorMessage('존재하지 않는 아이디입니다.');
                }
            })
            .catch(() => setErrorMessage('서버 오류: 아이디 확인 실패'));
    };

    // 인증번호 발송
    const handleSendCode = () => {
        if (!phone.trim()) {
            setErrorMessage('휴대폰 번호를 입력하세요.');
            return;
        }

        setShowCode(true);
        setErrorMessage('');
    };

    // 인증번호 확인 (1111 하드코딩)
    const handleVerifyCode = () => {
        if (code !== '1111') {
            setErrorMessage('인증번호가 일치하지 않습니다.');
            return;
        }

        setIsVerified(true);
        setShowPassword(true);
        setErrorMessage('');
    };

    // 비밀번호 저장
    const handleSavePassword = () => {
        if (newPassword !== confirmPassword) {
            setErrorMessage('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (newPassword.length < 6) {
            setErrorMessage('비밀번호는 6자 이상이어야 합니다.');
            return;
        }

        axios.post('http://localhost:3005/user/reset-password', {
            userId,
            newPassword
        })
            .then(() => {
                alert('비밀번호가 성공적으로 변경되었습니다.');
                handleClose();
            })
            .catch(() => setErrorMessage('비밀번호 변경 실패. 다시 시도하세요.'));
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ fontSize: '1.8rem', fontWeight: 700, textAlign: 'center', padding: '20px 20px' }}>
                비밀번호 찾기
            </DialogTitle>
            <DialogContent sx={{ padding: '30px 40px', width: '100%', maxWidth: '700px', margin: '0 auto' }}>
                {errorMessage && <Typography color="error" sx={{ mb: 2, fontSize: '1.1rem' }}>{errorMessage}</Typography>}

                {/* 아이디 입력 + 확인 버튼 */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        placeholder="아이디"
                        fullWidth
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        InputProps={{ style: { fontSize: '1rem' } }}
                    />
                    <Button variant="contained" onClick={handleCheckUserId} sx={{ fontSize: '1rem', minWidth: '120px' }}>
                        확인
                    </Button>
                </Stack>

                {/* 휴대폰 번호 입력 */}
                {showPhone && (
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <TextField
                            placeholder="휴대폰 번호"
                            fullWidth
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            InputProps={{ style: { fontSize: '1rem' } }}
                        />
                        <Button variant="contained" onClick={handleSendCode} sx={{ fontSize: '1rem', minWidth: '120px' }}>
                            인증하기
                        </Button>
                    </Stack>
                )}

                {/* 인증번호 입력 + 인증 확인 버튼 */}
                {showCode && !isVerified && (
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                        <TextField
                            placeholder="인증번호 (1111)"
                            fullWidth
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            InputProps={{ style: { fontSize: '1rem' } }}
                        />
                        <Button variant="contained" onClick={handleVerifyCode} sx={{ fontSize: '1rem', minWidth: '120px' }}>
                            인증확인
                        </Button>
                    </Stack>
                )}

                {/* 비밀번호 입력 */}
                {showPassword && isVerified && (
                    <Stack spacing={2} sx={{ mb: 3 }}>
                        <TextField
                            placeholder="새 비밀번호"
                            fullWidth
                            margin="normal"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            InputProps={{ style: { fontSize: '1rem' } }}
                        />
                        <TextField
                            placeholder="비밀번호 확인"
                            fullWidth
                            margin="normal"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            InputProps={{ style: { fontSize: '1rem' } }}
                        />
                        <Button variant="contained" fullWidth onClick={handleSavePassword} sx={{ fontSize: '1rem', padding: '10px 0' }}>
                            저장
                        </Button>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions sx={{ padding: '10px 40px' }}>
                <Button onClick={handleClose} color="secondary" sx={{ fontSize: '1rem', minWidth: '120px' }}>
                    취소
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default PasswordReset;
