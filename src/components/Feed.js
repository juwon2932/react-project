import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Button, Avatar, IconButton } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ShareIcon from '@mui/icons-material/Share';
import Swal from 'sweetalert2';
import ArrowBackIos from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIos from '@mui/icons-material/ArrowForwardIos';
import axios from 'axios';
import './Feed.css';

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function Feed() {
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyMap, setReplyMap] = useState({});
    const [activeReply, setActiveReply] = useState(null);
    const [expandedComments, setExpandedComments] = useState({});
    const [detailImages, setDetailImages] = useState([]);
    const [currentDetailImage, setCurrentDetailImage] = useState(0);
    const [cardImageIndexes, setCardImageIndexes] = useState({});

    const [isFollowing, setIsFollowing] = useState(false);
    // ✅ 세션 체크 함수
    const checkSession = () => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (token && userId) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const exp = payload.exp * 1000;

                // ✅ 세션 상태 콘솔 로그
                console.log("✅ 세션 체크:");
                console.log("Token:", token);
                console.log("User ID:", userId);
                console.log("Token Expiration:", new Date(exp).toLocaleString());
                console.log("Current Time:", new Date().toLocaleString());
                console.log("Token Valid:", Date.now() < exp);
                console.log("User ID Match:", payload.userId === userId);

                // ✅ 세션 유효성 검사
                return payload.userId === userId && Date.now() < exp;
            } catch (e) {
                console.error("⚠️ 토큰 검증 오류:", e);
                return false;
            }
        }

        console.log("❌ 세션 없음");
        return false;
    };

    useEffect(() => {
        checkSession();
        fetchPosts();
    }, []); // selectedPost 빼라

    // 팔로우 상태만 selectedPost 바뀔 때 체크
    useEffect(() => {
        if (selectedPost && selectedPost.NICKNAME) {
            checkFollowStatus(selectedPost.NICKNAME);
        }
    }, [selectedPost]);

    // ✅ 로그인 여부 체크 함수 (토큰 만료 포함)
    const isLoggedIn = () => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("userId");

        if (!token || !userId) return false;

        try {
            // ✅ JWT 디코딩 (헤더.페이로드.서명)
            const payloadBase64 = token.split(".")[1];
            const decodedPayload = JSON.parse(atob(payloadBase64));
            const exp = decodedPayload.exp * 1000;
            const tokenUserId = decodedPayload.userId;

            console.log("Token:", token);
            console.log("User ID:", userId);
            console.log("Decoded User ID:", tokenUserId);
            console.log("Token Expiration:", new Date(exp).toLocaleString());
            console.log("Current Time:", new Date().toLocaleString());
            console.log("Token Valid:", Date.now() < exp);
            console.log("User ID Match:", tokenUserId === userId);

            // ✅ 토큰 유효성 검사
            return tokenUserId === userId && Date.now() < exp;
        } catch (e) {
            console.error("⚠️ 토큰 검증 오류:", e);
            return false;
        }
    };

    // 📌 모든 게시글 불러오기 (비로그인 허용)
    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const response = await axios.get('http://localhost:3005/feed/list', {
                headers,
                withCredentials: false,
            });
            console.log('response:', response.data);

            if (response.data.success) {
                let posts = response.data.posts.map(post => ({
                    ...post,
                    liked: !!post.LIKED,
                    LIKE_COUNT: post.LIKE_COUNT || 0,
                    USER_ID: post.USER_ID
                }));

                // 👇 중복 제거
                posts = Array.from(new Map(posts.map(p => [p.FEED_ID, p])).values());

                // 👇 랜덤 섞기 (여기가 핵심!)
                posts = shuffleArray(posts);

                setPosts(posts);
                console.log('posts:', posts);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    // 📌 댓글 불러오기 (비로그인 허용)
    const fetchComments = async (feedId) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await axios.get(`http://localhost:3005/comments/${feedId}`, {
                headers,
                withCredentials: false,
            });

            if (response.data.success) {
                setComments(response.data.comments);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };



    // 📌 댓글 좋아요 토글
    const handleCommentLike = async (commentId) => {
        if (!isLoggedIn()) {
            Swal.fire({
                icon: 'warning',
                title: '로그인이 필요합니다',
                text: '로그인 후 이용해주세요.',
                confirmButtonColor: '#3897f0',
            });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`http://localhost:3005/comments/like`, { commentId }, {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true,
            });

            if (response.data.success) {
                setComments(comments.map(comment =>
                    comment.COMMENT_ID === commentId ? {
                        ...comment,
                        liked: response.data.liked,
                        LIKE_COUNT: response.data.likeCount
                    } : comment
                ));
            }
        } catch (error) {
            console.error('Error liking comment:', error);
        }
    };




    // 📌 게시글 클릭 시 상세보기 및 댓글 로딩
    const handlePostClick = async (post) => {
        setSelectedPost({
            ...post,
            PROFILE_IMG: post.PROFILE_IMG || 'default-profile.png',
            VIEWS: post.VIEWS || 0
        });

        try {
            const res = await axios.get(`http://localhost:3005/feed/${post.FEED_ID}/images`);
            // ★ 여기가 진짜 이미지 배열임
            console.log("상세 이미지 리스트:", res.data);

            if (res.data.success && Array.isArray(res.data.images)) {
                setDetailImages(res.data.images);
                setCurrentDetailImage(0);
                if (res.data.images.length > 0) {
                    console.log('슬라이더 첫 이미지 src:', `http://localhost:3005/uploads/posts/${res.data.images[0]}`);
                }
            } else {
                setDetailImages([]);
            }
        } catch (err) {
            console.error('Error fetching images:', err);
            setDetailImages([]);
        }

        increaseViewCount(post.FEED_ID);
        fetchComments(post.FEED_ID);
    };

    // 2. (컴포넌트 내부) 디버깅용 useEffect
    useEffect(() => {
        if (selectedPost) {
            console.log('detailImages:', detailImages);
            if (detailImages.length > 0) {
                console.log('현재 슬라이더 이미지 src:', `http://localhost:3005/uploads/posts/${detailImages[currentDetailImage]}`);
            }
        }
    }, [detailImages, currentDetailImage, selectedPost]);



    const handleAddComment = async () => {
        if (!isLoggedIn()) {
            Swal.fire({
                icon: 'warning',
                title: '로그인이 필요합니다',
                text: '로그인 후 이용해주세요.',
                confirmButtonColor: '#3897f0',
            });
            return;
        }

        if (newComment.trim() === "" || !selectedPost) return;

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post('http://localhost:3005/comments', {
                feedId: selectedPost.FEED_ID,
                content: newComment
            }, {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true,
            });

            if (response.data.success) {
                setComments([...comments, {
                    COMMENT_ID: Date.now(),
                    PARENT_COMMENT_ID: null,
                    NICKNAME: "나",
                    PROFILE_IMG: null,
                    CONTENT: newComment,
                    CREATED_AT: new Date().toISOString(),
                    replies: []
                }]);
                setNewComment("");
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    // 📌 대댓글 추가하기 (로그인 필수)
    const handleAddReply = async (parentCommentId) => {
        if (!isLoggedIn()) {
            Swal.fire({
                icon: 'warning',
                title: '로그인이 필요합니다',
                text: '로그인 후 이용해주세요.',
                confirmButtonColor: '#3897f0',
            });
            return;
        }

        const replyContent = replyMap[parentCommentId];
        if (!replyContent || !selectedPost) return;

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post('http://localhost:3005/comments', {
                feedId: selectedPost.FEED_ID,
                content: replyContent,
                parentCommentId: parentCommentId
            }, {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true,
            });

            if (response.data.success) {
                // ✅ 서버에서 가져온 최신 댓글 목록으로 갱신
                fetchComments(selectedPost.FEED_ID);
                setReplyMap(prev => ({ ...prev, [parentCommentId]: "" }));
                setActiveReply(null);
            }
        } catch (error) {
            console.error('Error adding reply:', error);
        }
    };



    // 📌 더보기 버튼
    const toggleReplies = (commentId) => {
        setExpandedComments(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    // 📌 게시글 좋아요 토글 (로그인 필수)
    const handleLike = async (postId) => {
        if (!isLoggedIn()) {
            Swal.fire({
                icon: 'warning',
                title: '로그인이 필요합니다',
                text: '로그인 후 이용해주세요.',
                confirmButtonColor: '#3897f0',
            });
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`http://localhost:3005/feed/like`, { feedId: postId }, {
                headers: { 'Authorization': `Bearer ${token}` },
                withCredentials: true,
            });

            if (response.data.success) {
                setPosts(posts.map(post =>
                    post.FEED_ID === postId ? {
                        ...post,
                        liked: response.data.liked,
                        LIKE_COUNT: response.data.likeCount
                    } : post
                ));
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };




    // 📌 공유 기능 (프론트에서만 처리)
    const handleShare = (postId) => {
        alert(`게시글 ${postId}를 공유했습니다.`);
    };

    // 📌 팔로우 상태 체크
    const checkFollowStatus = async (nickname) => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await axios.get(`http://localhost:3005/follow/status/${nickname}`, {
                headers,
            });

            if (response.data.success) {
                setIsFollowing(response.data.isFollowing);
            }
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    // 📌 팔로우/언팔로우 토글
    const handleFollowToggle = async () => {
        try {
            const token = localStorage.getItem("token");
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const url = isFollowing
                ? `http://localhost:3005/follow/unfollow/${selectedPost.NICKNAME}`
                : `http://localhost:3005/follow/follow/${selectedPost.NICKNAME}`;

            const response = await axios.post(url, {}, { headers });

            if (response.data.success) {
                setIsFollowing(!isFollowing);
            }
        } catch (error) {
            console.error('Error toggling follow status:', error);
        }
    };

    // 📌 조회수 증가 요청 (비로그인 허용)
    const increaseViewCount = async (feedId) => {
        try {
            const response = await axios.post(`http://localhost:3005/feed/views/${feedId}`);
            console.log("조회수 증가 성공:", response.data);
        } catch (error) {
            console.error('Error increasing view count:', error);
        }
    };

    // 왼쪽 카드(목록) - 이전 이미지
    const handlePrevCardImage = (feedId) => {
        setCardImageIndexes(prev => {
            const post = posts.find(p => p.FEED_ID === feedId);
            if (!post || !post.IMAGES || post.IMAGES.length === 0) return prev;
            const len = post.IMAGES.length;
            const cur = prev[feedId] || 0;
            return { ...prev, [feedId]: (cur - 1 + len) % len };
        });
    };
    // 왼쪽 카드(목록) - 다음 이미지
    const handleNextCardImage = (feedId) => {
        setCardImageIndexes(prev => {
            const post = posts.find(p => p.FEED_ID === feedId);
            if (!post || !post.IMAGES || post.IMAGES.length === 0) return prev;
            const len = post.IMAGES.length;
            const cur = prev[feedId] || 0;
            return { ...prev, [feedId]: (cur + 1) % len };
        });
    };

    // 상세(오른쪽) - 이전 이미지
    const handlePrevDetailImage = () => {
        setCurrentDetailImage(prev =>
            (prev - 1 + detailImages.length) % detailImages.length
        );
    };

    // 상세(오른쪽) - 다음 이미지
    const handleNextDetailImage = () => {
        setCurrentDetailImage(prev =>
            (prev + 1) % detailImages.length
        );
    };

    return (
        <Container maxWidth="lg" className="feed-container">
            {/* 게시글 목록 */}
            <div className="feed-list">
                {posts.map((post) => (
                    <div key={post.FEED_ID} className="feed-item" onClick={() => handlePostClick(post)}>
                        <div className="feed-card">
                            <div className="feed-header">
                                <Avatar
                                    src={`http://localhost:3005/feed/profile/${post.NICKNAME}`}
                                    alt="Profile"
                                    className="profile-avatar"
                                >
                                    {post.NICKNAME ? post.NICKNAME.charAt(0).toUpperCase() : "?"}
                                </Avatar>
                                <div className="feed-info">
                                    <Typography variant="subtitle1" className="nickname">
                                        {post.NICKNAME || '익명'}
                                    </Typography>
                                    <Typography variant="caption" className="upload-date">
                                        {new Date(post.CREATED_AT).toLocaleDateString()}
                                    </Typography>
                                </div>
                            </div>
                            {post.IMG_URL && (
                                <img
                                    src={`http://localhost:3005/uploads/posts/${post.IMG_URL}`}
                                    alt="Post"
                                    className="feed-image"
                                />
                            )}
                            <div className="feed-actions" style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleLike(post.FEED_ID);
                                        }}
                                        disabled={!isLoggedIn()}
                                    >
                                        {post.liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                                    </IconButton>
                                    <Typography variant="body2" style={{ fontSize: '14px', color: '#555' }}>
                                        {post.LIKE_COUNT}
                                    </Typography>
                                </div>
                                <IconButton onClick={(e) => { e.stopPropagation(); handleShare(post.FEED_ID); }}>
                                    <ShareIcon />
                                </IconButton>
                                <IconButton onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}>
                                    <ChatBubbleOutlineIcon />
                                </IconButton>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 오른쪽 상세보기 */}
            {selectedPost && (
                <div className="feed-details">
                    <div className="feed-details-header">
                        <Avatar
                            src={`http://localhost:3005/uploads/profile/${selectedPost.PROFILE_IMG}`}
                            alt="Profile"
                            className="profile-avatar-large"
                        >
                            {selectedPost.NICKNAME ? selectedPost.NICKNAME.charAt(0).toUpperCase() : "?"}
                        </Avatar>
                        <div className="feed-details-info">
                            <Typography variant="h5" className="nickname">
                                {selectedPost.NICKNAME || '익명'}
                            </Typography>
                            <Typography variant="body2" className="upload-date">
                                {new Date(selectedPost.CREATED_AT).toLocaleDateString()}
                            </Typography>
                        </div>

                        {/* 📌 팔로우 배지 */}
                        {selectedPost && localStorage.getItem("userId") !== selectedPost.USER_ID && (
                            <div
                                className={`follow-badge ${isFollowing ? 'following' : 'not-following'}`}
                                onClick={handleFollowToggle}
                            >
                                {isFollowing ? "팔로잉 ✔️" : "팔로우"}
                            </div>
                        )}
                    </div>

                    {/* 🖼️ 게시글 이미지 (원본 비율 유지, 크기 제한) */}
                    <div className="feed-details-left" style={{ position: "relative", textAlign: "center" }}>
                        {detailImages.length > 0 && (
                            <>
                                {detailImages.length > 1 && (
                                    <IconButton
                                        style={{
                                            position: "absolute",
                                            top: "50%",
                                            left: 0,
                                            zIndex: 2,
                                            transform: "translateY(-50%)",
                                            background: "rgba(255,255,255,0.7)"
                                        }}
                                        onClick={handlePrevDetailImage}
                                    >
                                        <ArrowBackIos />
                                    </IconButton>
                                )}
                                <img
                                    src={`http://localhost:3005/uploads/posts/${detailImages[currentDetailImage]}`}
                                    alt={`PostImage${currentDetailImage}`}
                                    className="feed-details-image"
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "600px",
                                        width: "auto",
                                        height: "auto",
                                        display: "block",
                                        margin: "0 auto",
                                        borderRadius: "12px"
                                    }}
                                />
                                {detailImages.length > 1 && (
                                    <IconButton
                                        style={{
                                            position: "absolute",
                                            top: "50%",
                                            right: 0,
                                            zIndex: 2,
                                            transform: "translateY(-50%)",
                                            background: "rgba(255,255,255,0.7)"
                                        }}
                                        onClick={handleNextDetailImage}
                                    >
                                        <ArrowForwardIos />
                                    </IconButton>
                                )}
                                {/* 아래에 이미지 인덱스 표시 */}
                                {detailImages.length > 1 && (
                                    <div style={{
                                        marginTop: 8,
                                        fontSize: 13,
                                        color: "#888",
                                        letterSpacing: 1,
                                        fontWeight: 500
                                    }}>
                                        {currentDetailImage + 1} / {detailImages.length}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* 📝 좋아요 / 공유 아이콘 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* 좋아요 버튼 */}
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(selectedPost.FEED_ID);
                                }}
                                disabled={!isLoggedIn()}
                            >
                                {selectedPost.liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                            </IconButton>
                            <Typography variant="body2" style={{ fontSize: '14px', color: '#555' }}>
                                {selectedPost.LIKE_COUNT}
                            </Typography>

                            {/* 공유하기 버튼 */}
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(selectedPost.FEED_ID);
                                }}
                            >
                                <ShareIcon />
                            </IconButton>
                        </div>
                    </div>

                    {/* 📝 게시글 내용 */}
                    <div className="feed-details-right">
                        <Typography variant="h4" className="feed-details-title">
                            {selectedPost.TITLE}
                        </Typography>
                        <Typography variant="body1" className="feed-details-contents">
                            {selectedPost.CONTENTS}
                        </Typography>

                        {/* 📊 조회수 표시 */}
                        <div className="view-count">
                            <Typography variant="body2" style={{ color: "#888", marginBottom: "10px" }}>
                                조회수: {selectedPost.VIEWS || 0}회
                            </Typography>
                        </div>

                        {/* 📝 댓글 입력 필드 */}
                        <div className="comment-input-container">
                            <TextField
                                fullWidth
                                placeholder="댓글 달기..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="comment-input"
                                disabled={!isLoggedIn()}
                            />
                            <Button
                                variant="contained"
                                className="comment-submit-btn"
                                onClick={handleAddComment}
                                disabled={!isLoggedIn() || newComment.trim() === ""}
                            >
                                댓글 달기
                            </Button>
                        </div>

                        {/* 🗨️ 댓글 목록 */}
                        <div className="comment-list">
                            {comments.map((comment) => (
                                <div key={comment.COMMENT_ID} className="comment-item">
                                    {/* 🖼️ 프로필 이미지 + 닉네임 */}
                                    <div className="comment-header">
                                        <Avatar
                                            src={
                                                comment.PROFILE_IMG === "default-profile.png" || !comment.PROFILE_IMG
                                                    ? "http://localhost:3005/uploads/profile/default-profile.png"
                                                    : `http://localhost:3005/uploads/profile/${comment.PROFILE_IMG}`
                                            }
                                            alt="Profile"
                                            className="comment-avatar"
                                        >
                                            {comment.NICKNAME ? comment.NICKNAME.charAt(0).toUpperCase() : "?"}
                                        </Avatar>
                                        <Typography variant="subtitle1" className="comment-nickname">
                                            {comment.NICKNAME || "익명"}
                                        </Typography>
                                    </div>
                                    {/* 📝 댓글 내용 */}
                                    <Typography variant="body2" className="comment-content">
                                        {comment.CONTENT}
                                    </Typography>
                                    {/* 🗂️ 댓글 액션 (좋아요, 대댓글) */}
                                    <div className="comment-actions">
                                        <IconButton
                                            onClick={() => handleCommentLike(comment.COMMENT_ID)}
                                            disabled={!isLoggedIn()}
                                        >
                                            {comment.liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                                        </IconButton>
                                        <Typography variant="body2">{comment.LIKE_COUNT}</Typography>

                                        <IconButton onClick={() => setActiveReply(comment.COMMENT_ID)}>
                                            <ChatBubbleOutlineIcon />
                                        </IconButton>

                                        {comment.replies.length > 0 && (
                                            <IconButton onClick={() => toggleReplies(comment.COMMENT_ID)}>
                                                {expandedComments[comment.COMMENT_ID] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        )}
                                    </div>

                                    {/* ↪️ 대댓글 목록 */}
                                    {comment.replies && expandedComments[comment.COMMENT_ID] && comment.replies.length > 0 && (
                                        <div className="reply-box">
                                            {comment.replies.map(reply => (
                                                <div key={reply.COMMENT_ID} className="reply-item">
                                                    {/* 아바타 왼쪽 */}
                                                    <Avatar
                                                        src={
                                                            reply.PROFILE_IMG === "default-profile.png" || !reply.PROFILE_IMG
                                                                ? "http://localhost:3005/uploads/profile/default-profile.png"
                                                                : `http://localhost:3005/uploads/profile/${reply.PROFILE_IMG}`
                                                        }
                                                        alt="Profile"
                                                        className="reply-avatar"
                                                    >
                                                        {reply.NICKNAME ? reply.NICKNAME.charAt(0).toUpperCase() : "?"}
                                                    </Avatar>
                                                    <div className="reply-body">
                                                        <Typography variant="subtitle1" className="reply-nickname">
                                                            ↪ {reply.NICKNAME || "익명"}
                                                        </Typography>
                                                        <Typography variant="body2" className="reply-content">
                                                            {reply.CONTENT}
                                                        </Typography>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* ✏️ 대댓글 입력 필드 */}
                                    {activeReply === comment.COMMENT_ID && (
                                        <>
                                            <TextField
                                                fullWidth
                                                placeholder="대댓글 달기..."
                                                value={replyMap[comment.COMMENT_ID] || ""}
                                                onChange={(e) =>
                                                    setReplyMap({ ...replyMap, [comment.COMMENT_ID]: e.target.value })
                                                }
                                                className="reply-input"
                                            />
                                            <Button className="reply-submit-btn" onClick={() => handleAddReply(comment.COMMENT_ID)}>
                                                대댓글 달기
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </Container>
    );
}

export default Feed;
