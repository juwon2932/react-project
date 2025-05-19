import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareIcon from "@mui/icons-material/Share";

function Shorts() {
    const [shortsList, setShortsList] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [slideDir, setSlideDir] = useState(null); // 슬라이드 방향
    const [animating, setAnimating] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => { fetchShorts(); }, []);

    const fetchShorts = async () => {
        try {
            const res = await axios.get("http://localhost:3005/shorts/list");
            if (res.data.success) setShortsList(res.data.shorts);
        } catch (err) {
            console.error("쇼츠 불러오기 오류:", err);
        }
    };

    // 슬라이드 전환 함수
    const slideTo = (nextIdx, dir) => {
        if (animating || nextIdx === currentIdx) return;
        setSlideDir(dir);
        setAnimating(true);
        setTimeout(() => {
            setCurrentIdx(nextIdx);
            setAnimating(false);
        }, 260); // 슬라이드 지속시간(0.26초)
    };

    // 휠
    let wheelLock = false;
    const handleWheel = (e) => {
        if (wheelLock) return;
        wheelLock = true;
        setTimeout(() => { wheelLock = false }, 260);
        if (e.deltaY > 0 && currentIdx < shortsList.length - 1)
            slideTo(currentIdx + 1, "down");
        else if (e.deltaY < 0 && currentIdx > 0)
            slideTo(currentIdx - 1, "up");
    };

    // 스와이프
    let touchStartY = 0;
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchEnd = (e) => {
        const touchEndY = e.changedTouches[0].clientY;
        const diff = touchStartY - touchEndY;
        if (Math.abs(diff) < 50) return;
        if (diff > 0 && currentIdx < shortsList.length - 1)
            slideTo(currentIdx + 1, "down");
        else if (diff < 0 && currentIdx > 0)
            slideTo(currentIdx - 1, "up");
    };

    if (!shortsList.length) return <div style={{ textAlign: "center", marginTop: 100, color: "#fff" }}>쇼츠가 없습니다.</div>;

    const shorts = shortsList[currentIdx];
    const videoSrc = shorts.VIDEO_URL.startsWith("http")
        ? shorts.VIDEO_URL
        : `http://localhost:3005/uploads/posts/videos/${shorts.VIDEO_URL}`;

    // 슬라이드 애니메이션 스타일
    const slideStyle = animating
        ? {
            transition: "transform 0.26s cubic-bezier(.4,1,.3,1)",
            transform: slideDir === "down"
                ? "translateY(-100%)"
                : "translateY(100%)"
        }
        : { transition: "none", transform: "translateY(0%)" };

    return (
        <div
            ref={containerRef}
            style={{
                width: "100vw",
                height: "100vh",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
            }}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "32px",
            }}>
                {/* 쇼츠 카드 + 슬라이드 애니메이션 */}
                <div
                    style={{
                        position: "relative",
                        width: 380,
                        height: 670,
                        background: "#111",
                        borderRadius: 28,
                        overflow: "hidden",
                        boxShadow: "0 8px 40px #000b, 0 2px 10px #0006",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        ...slideStyle
                    }}
                >
                    <video
                        key={shorts.VIDEO_URL}
                        src={videoSrc}
                        controls
                        autoPlay
                        muted
                        loop
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            background: "#222"
                        }}
                    />
                </div>
                {/* 오른쪽 아이콘 */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "30px",
                        padding: "12px 4px",
                    }}
                >
                    <IconBtn><FavoriteIcon style={{ fontSize: 32, color: "#ff2d55" }} /></IconBtn>
                    <IconBtn><ThumbDownIcon style={{ fontSize: 32, color: "#111" }} /></IconBtn>
                    <IconBtn><ChatBubbleOutlineIcon style={{ fontSize: 32, color: "#111" }} /></IconBtn>
                    <IconBtn><ShareIcon style={{ fontSize: 32, color: "#111" }} /></IconBtn>
                </div>
            </div>
        </div>
    );
}

function IconBtn({ children }) {
    return (
        <button style={{
            background: "rgba(38,38,38,0.82)",
            border: "none",
            outline: "none",
            borderRadius: "50%",
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: 0,
            cursor: "pointer",
            transition: "background 0.2s",
        }}>
            {children}
        </button>
    );
}

export default Shorts;
