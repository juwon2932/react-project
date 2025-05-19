import React, { useState, useEffect } from 'react';
import './ProfilePage.css';
import axios from 'axios';

import { Modal, Box, TextField, Button } from '@mui/material';
import Swal from 'sweetalert2';

export default function ProfilePage() {
    const [nickname, setNickname] = useState('');
    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [shorts, setShorts] = useState([]);
    const [tags, setTags] = useState([]);
    const [stats, setStats] = useState({ followers: 0, followings: 0, posts: 0 });
    const [preview, setPreview] = useState('');

    // 상세/수정 모달
    const [modalOpen, setModalOpen] = useState(false);
    const [editPost, setEditPost] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editImg, setEditImg] = useState(null);
    const [imgPreview, setImgPreview] = useState('');

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        const token = localStorage.getItem("token");
        if (storedUser && token) {
            const sessionUser = JSON.parse(storedUser);
            setNickname(sessionUser.nickname || '닉네임 없음');
            fetchUserData(sessionUser.nickname, token);
            fetchStats(sessionUser.nickname, token);
            fetchProfileImg(sessionUser.nickname, token);
        }
    }, []);

    const fetchUserData = async (nickname, token) => {
        try {
            const [postsResponse, shortsResponse, tagsResponse] = await Promise.all([
                axios.get(`http://localhost:3005/mypage/${nickname}/posts`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                axios.get(`http://localhost:3005/mypage/${nickname}/shorts`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                }),
                axios.get(`http://localhost:3005/mypage/${nickname}/tags`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                })
            ]);
            setPosts(postsResponse.data);
            setShorts(shortsResponse.data);
            setTags(tagsResponse.data);
        } catch (error) {
            console.error('데이터 불러오기 오류:', error);
        }
    };

    const fetchStats = async (nickname, token) => {
        try {
            const response = await axios.get(`http://localhost:3005/mypage/${nickname}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            setStats(response.data);
        } catch (error) {
            console.error('통계 데이터 불러오기 오류:', error);
        }
    };

    const fetchProfileImg = async (nickname, token) => {
        try {
            const response = await axios.get(`http://localhost:3005/mypage/${nickname}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.data.success) {
                const profilePath = response.data.profileImg;
                const fullPath = profilePath.startsWith("http")
                    ? profilePath
                    : `http://localhost:3005/uploads/profile/${profilePath}`;
                setPreview(fullPath);
            } else {
                setPreview('default-profile.png');
            }
        } catch (error) {
            console.error('프로필 이미지 불러오기 오류:', error);
        }
    };

    // 프로필 이미지 변경
    const handleProfileImgChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const token = localStorage.getItem("token");
        const storedUser = sessionStorage.getItem("user");

        if (!storedUser || !token) {
            alert("로그인이 필요합니다.");
            return;
        }

        const sessionUser = JSON.parse(storedUser);
        const { nickname, region, intro } = sessionUser;

        const formData = new FormData();
        formData.append("profileImg", file);
        formData.append("nickname", nickname || "닉네임 없음");
        formData.append("region", region || "지역 없음");
        formData.append("intro", intro || "소개 없음");

        try {
            const response = await axios.post("http://localhost:3005/mypage/update-profile", formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                alert("프로필 이미지가 성공적으로 업데이트되었습니다.");
                setPreview(URL.createObjectURL(file));
            } else {
                alert("프로필 이미지 업데이트 실패: " + response.data.message);
            }
        } catch (error) {
            console.error("프로필 이미지 업로드 오류:", error);
            alert("프로필 이미지 업로드 중 오류가 발생했습니다.");
        }
    };

    // 탭 전환
    const handleTabClick = (tab) => setActiveTab(tab);

    // 게시글 카드 클릭 → 모달 오픈
    const handleCardClick = (post) => {
        setEditPost(post);
        setEditTitle(post.TITLE || '');
        setEditContent(post.CONTENTS || '');
        setImgPreview(`http://localhost:3005/uploads/posts/${post.IMG_URL}`);
        setEditImg(null);
        setModalOpen(true);
    };

    // 모달 이미지 변경
    const handleEditImgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditImg(file);
            setImgPreview(URL.createObjectURL(file));
        }
    };

    // 게시물 삭제 (모달 닫고 → Swal 띄움)
    const handleDeletePost = async () => {
        setModalOpen(false); // 모달 먼저 닫기!
        setTimeout(async () => {
            const result = await Swal.fire({
                title: '정말 삭제하시겠습니까?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '삭제',
                cancelButtonText: '취소',
                customClass: { popup: 'swal-popup-zindex-fix' }
            });
            if (result.isConfirmed) {
                const token = localStorage.getItem("token");
                try {
                    const res = await axios.delete(`http://localhost:3005/feed/${editPost.FEED_ID}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.data.success) {
                        Swal.fire({
                            title: "삭제 완료",
                            icon: "success",
                            customClass: { popup: 'swal-popup-zindex-fix' }
                        });
                        setPosts(posts.filter(p => p.FEED_ID !== editPost.FEED_ID));
                    } else {
                        Swal.fire({
                            title: "삭제 실패",
                            text: res.data.message || "",
                            icon: "error",
                            customClass: { popup: 'swal-popup-zindex-fix' }
                        });
                    }
                } catch (err) {
                    Swal.fire({
                        title: "에러",
                        text: "삭제 중 오류 발생",
                        icon: "error",
                        customClass: { popup: 'swal-popup-zindex-fix' }
                    });
                }
            }
        }, 200); // 0.2초만 모달 닫고 띄우면 됨
    };

    // 게시물 수정 저장 (모달 닫고 → Swal)
    const handleSaveEdit = async () => {
        if (!editTitle.trim() || !editContent.trim()) {
            Swal.fire({
                title: "제목/내용을 입력하세요",
                icon: "warning",
                customClass: { popup: 'swal-popup-zindex-fix' }
            });
            return;
        }
        setModalOpen(false);
        setTimeout(async () => {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("title", editTitle);
            formData.append("contents", editContent);
            if (editImg) formData.append("img", editImg);

            try {
                const res = await axios.put(`http://localhost:3005/feed/${editPost.FEED_ID}`, formData, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
                });
                if (res.data.success) {
                    Swal.fire({
                        title: "수정 완료",
                        icon: "success",
                        customClass: { popup: 'swal-popup-zindex-fix' }
                    });
                    setPosts(posts.map(p =>
                        p.FEED_ID === editPost.FEED_ID
                            ? { ...p, TITLE: editTitle, CONTENTS: editContent, IMG_URL: res.data.imgUrl || p.IMG_URL }
                            : p
                    ));
                } else {
                    Swal.fire({
                        title: "수정 실패",
                        text: res.data.message || "",
                        icon: "error",
                        customClass: { popup: 'swal-popup-zindex-fix' }
                    });
                }
            } catch (err) {
                Swal.fire({
                    title: "에러",
                    text: "수정 중 오류 발생",
                    icon: "error",
                    customClass: { popup: 'swal-popup-zindex-fix' }
                });
            }
        }, 200);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditPost(null);
        setEditImg(null);
        setImgPreview('');
    };

    return (
        <div className="profile-page-container">
            {/* 프로필 섹션 */}
            <div className="profile-section">
                <div
                    className="profile-image"
                    style={{
                        width: "150px",
                        height: "150px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto",
                        border: "2px solid #ddd",
                        backgroundColor: "#f5f5f5",
                        marginBottom: "20px",
                    }}
                    onClick={() => document.getElementById('profile-upload').click()}
                >
                    <img
                        src={preview}
                        alt="Profile"
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                </div>
                <input
                    type="file"
                    id="profile-upload"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleProfileImgChange}
                />
                <div className="profile-nickname">{nickname}</div>
                <div className="profile-stats">
                    <div className="profile-stat">
                        <div className="profile-stat-number">{stats.posts}</div>
                        <div className="profile-stat-label">게시물</div>
                    </div>
                    <div className="profile-stat">
                        <div className="profile-stat-number">{stats.followers}</div>
                        <div className="profile-stat-label">팔로워</div>
                    </div>
                    <div className="profile-stat">
                        <div className="profile-stat-number">{stats.followings}</div>
                        <div className="profile-stat-label">팔로잉</div>
                    </div>
                </div>
            </div>

            {/* 탭 메뉴 */}
            <div className="profile-tabs">
                <button className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => handleTabClick('posts')}>게시물</button>
                <button className={`profile-tab ${activeTab === 'shorts' ? 'active' : ''}`} onClick={() => handleTabClick('shorts')}>쇼츠</button>
                <button className={`profile-tab ${activeTab === 'tags' ? 'active' : ''}`} onClick={() => handleTabClick('tags')}>태그됨</button>
            </div>

            {/* 콘텐츠 영역 */}
            <div className="profile-content">
                {activeTab === 'posts' && (
                    <div className="profile-post-grid">
                        {posts.map((post) => (
                            <div
                                key={post.FEED_ID}
                                className="profile-post-card"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleCardClick(post)}
                            >
                                <img src={`http://localhost:3005/uploads/posts/${post.IMG_URL}`} alt="Post" />
                                <div className="profile-post-title">{post.TITLE || '제목 없음'}</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'shorts' && (
                    <div className="profile-post-grid">
                        {shorts.map((short) => (
                            <div key={short.SHORTS_ID} className="profile-post-card">
                                <video src={`http://localhost:3005/uploads/shorts/${short.VIDEO_URL}`} controls />
                                <div className="profile-post-title">{short.TITLE || '제목 없음'}</div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'tags' && (
                    <div className="profile-post-grid">
                        {tags.map((tag) => (
                            <div key={tag.FEED_ID} className="profile-post-card">
                                <img src={`http://localhost:3005/uploads/posts/${tag.IMG_URL}`} alt="Tagged Post" />
                                <div className="profile-post-title">{tag.TITLE || '제목 없음'}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 게시글 상세/수정 모달 */}
            <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                disableEnforceFocus
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4
                }}>
                    <h2>게시물 수정</h2>
                    {imgPreview && (
                        <div style={{ marginBottom: 10, textAlign: 'center' }}>
                            <img src={imgPreview} alt="Post Preview" style={{ width: "100%", maxHeight: 180, objectFit: 'contain', borderRadius: 8 }} />
                        </div>
                    )}
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        이미지 변경/추가
                        <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleEditImgChange}
                        />
                    </Button>
                    <TextField
                        label="제목"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="내용"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        fullWidth
                        margin="normal"
                        multiline
                        rows={4}
                    />
                    <Box mt={2} sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                        <Button variant="contained" color="primary" onClick={handleSaveEdit}>저장</Button>
                        <Button variant="outlined" color="error" onClick={handleDeletePost}>삭제</Button>
                        <Button variant="outlined" color="secondary" onClick={handleCloseModal}>닫기</Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}
