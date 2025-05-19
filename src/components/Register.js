import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, TextField, MenuItem, Select, FormControl, InputLabel, IconButton } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import axios from 'axios';

function Register() {
    const [title, setTitle] = useState('');
    const [files, setFiles] = useState([]);
    const [content, setContent] = useState('');
    const [type, setType] = useState('FEED');
    const [previews, setPreviews] = useState([]);
    const [currentPreview, setCurrentPreview] = useState(0);

    useEffect(() => {
        const objectUrls = files.map(file => URL.createObjectURL(file));
        setPreviews(objectUrls);

        return () => objectUrls.forEach(url => URL.revokeObjectURL(url));
    }, [files]);

    const handleFileChange = (event) => {
        setFiles([...event.target.files]);
    };

    const handleNextPreview = () => {
        setCurrentPreview((prev) => (prev + 1) % previews.length);
    };

    const handlePrevPreview = () => {
        setCurrentPreview((prev) => (prev - 1 + previews.length) % previews.length);
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('type', type);

        files.forEach(file => {
            formData.append('mediaFiles', file);
        });

        try {
            await axios.post('http://localhost:3005/feed/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}`,
                },
                withCredentials: true,
            });

            alert('게시글 등록 성공!');
            setTitle('');
            setContent('');
            setFiles([]);
            setPreviews([]);
            setCurrentPreview(0);
        } catch (error) {
            console.error('게시글 등록 오류:', error);
            alert('게시글 등록 실패. 다시 시도해주세요.');
        }
    };

    return (
        <Container maxWidth="sm" style={{ marginTop: '20px' }}>
            <Typography variant="h4" style={{ marginBottom: '20px', fontWeight: 'bold' }}>글쓰기</Typography>

            <div style={{ position: 'relative', marginBottom: '15px', height: '400px', overflow: 'hidden', borderRadius: '10px', backgroundColor: '#f5f5f5' }}>
                {previews.length > 0 ? (
                    <>
                        <img src={previews[currentPreview]} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton onClick={handlePrevPreview} style={{ position: 'absolute', top: '50%', left: '10px', color: 'white' }}>
                            <ArrowBackIos />
                        </IconButton>
                        <IconButton onClick={handleNextPreview} style={{ position: 'absolute', top: '50%', right: '10px', color: 'white' }}>
                            <ArrowForwardIos />
                        </IconButton>
                        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex' }}>
                            {previews.map((_, idx) => (
                                <div key={idx} style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: currentPreview === idx ? '#ffffff' : '#888888',
                                    margin: '0 5px',
                                    cursor: 'pointer'
                                }} onClick={() => setCurrentPreview(idx)}></div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#ddd' }}></div>
                )}
            </div>

            <FormControl fullWidth style={{ marginBottom: '15px' }}>
                <InputLabel>게시글 타입</InputLabel>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                    <MenuItem value="FEED">피드</MenuItem>
                    <MenuItem value="SHORTS">쇼츠</MenuItem>
                </Select>
            </FormControl>

            <Button variant="outlined" component="label" fullWidth style={{ marginBottom: '15px' }}>
                미디어 파일 선택 (이미지/동영상)
                <input type="file" hidden multiple accept="image/*,video/*" onChange={handleFileChange} />
            </Button>

            <TextField fullWidth placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} style={{ marginBottom: '15px' }} />
            <TextField fullWidth multiline rows={10} placeholder="내용" value={content} onChange={(e) => setContent(e.target.value)} style={{ marginBottom: '15px' }} />

            <Button variant="contained" color="primary" fullWidth onClick={handleSubmit}>게시글 등록</Button>
        </Container>
    );
}

export default Register;
