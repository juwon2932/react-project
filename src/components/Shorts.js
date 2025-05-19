import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

// nickname을 props로 받는 구조 (상위 컴포넌트에서 <Shorts nickname="닉네임" />)
export default function Shorts({ nickname }) {
  const [shortsList, setShortsList] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const touchY = useRef(null);
  const scrollTimeout = useRef(null);

  // 1. 해당 사용자 닉네임으로 쇼츠 불러오기
  useEffect(() => {
    if (!nickname) return;
    axios.get(`/api/shorts/user/${encodeURIComponent(nickname)}`)
      .then(res => setShortsList(res.data))
      .catch(() => setShortsList([]));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [nickname]);

  // 2. 휠/스와이프 처리
  const handleWheel = (e) => {
    if (scrollTimeout.current) return;
    if (e.deltaY > 0 && currentIdx < shortsList.length - 1) setCurrentIdx(idx => idx + 1);
    else if (e.deltaY < 0 && currentIdx > 0) setCurrentIdx(idx => idx - 1);
    scrollTimeout.current = setTimeout(() => { scrollTimeout.current = null; }, 350);
  };
  const handleTouchStart = (e) => { touchY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e) => {
    if (!touchY.current) return;
    const endY = e.changedTouches[0].clientY;
    if (touchY.current - endY > 50 && currentIdx < shortsList.length - 1) setCurrentIdx(idx => idx + 1);
    else if (endY - touchY.current > 50 && currentIdx > 0) setCurrentIdx(idx => idx - 1);
    touchY.current = null;
  };

  if (!shortsList.length) {
    return (
      <div style={{
        width: "100vw", height: "100vh",
        background: "#fff",
        display: "flex", justifyContent: "center", alignItems: "center"
      }}>
        <span style={{ color: "#bbb", fontSize: 22 }}>쇼츠 없음</span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw", height: "100vh",
        overflow: "hidden", background: "#fff",
        position: "relative"
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          width: "100vw",
          height: "100vh",
          transition: "transform 0.45s cubic-bezier(.8,.2,.2,1)",
          transform: `translateY(-${currentIdx * 100}vh)`
        }}
      >
        {shortsList.map((shorts, idx) => (
          <div key={shorts.SHORTS_ID}
            style={{
              width: "100vw", height: "100vh",
              display: "flex", justifyContent: "center", alignItems: "center",
              position: "relative", background: "#fff"
            }}
          >
            {/* 영상 카드 */}
            <div
              style={{
                width: 420, height: 800, maxHeight: "86vh",
                borderRadius: 24, overflow: "hidden",
                background: "#000", boxShadow: "0 0 44px #0003, 0 2px 12px #2222",
                position: "relative",
                display: "flex", flexDirection: "column", justifyContent: "center",
                zIndex: 2
              }}
            >
              {/* 이미지 or 비디오 */}
              <img
                src={shorts.VIDEO_URL}
                alt={shorts.TITLE}
                style={{
                  width: "100%", height: "100%",
                  objectFit: "cover",
                  filter: "brightness(0.93)",
                  userSelect: "none"
                }}
                draggable={false}
              />

              {/* 상단 자막 - TITLE */}
              <div style={{
                position: "absolute", top: 32, left: 0, width: "100%", textAlign: "center",
                fontWeight: 900, fontSize: 36, color: "#fff",
                textShadow: "0 2px 18px #000b, 0 0 8px #000b", zIndex: 3
              }}>
                <span style={{
                  color: "#fff", background: "rgba(0,0,0,0.50)", borderRadius: 9, padding: "3px 20px"
                }}>
                  {shorts.TITLE}
                </span>
              </div>
              {/* 하단 인디케이터 */}
              <div style={{
                position: "absolute", left: 0, right: 0, bottom: 24, zIndex: 10,
                display: "flex", justifyContent: "center", alignItems: "center"
              }}>
                {shortsList.map((_, j) => (
                  <div key={j}
                    style={{
                      width: j === idx ? 15 : 9, height: 9,
                      borderRadius: 7,
                      background: j === idx ? "#111" : "#ddd",
                      margin: "0 4px", transition: "all .18s"
                    }} />
                ))}
              </div>
            </div>
            {/* 오른쪽 바깥 아이콘 메뉴 */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              marginLeft: 36, zIndex: 3
            }}>
              <ShortsIconBtn icon="👍" />
              <ShortsIconBtn icon="👎" />
              <ShortsIconBtn icon="💬" />
              <ShortsIconBtn icon="↗️" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 아이콘 버튼 컴포넌트 (카운트, 상태 등 props 추가 가능)
function ShortsIconBtn({ icon }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "16px 0" }}>
      <button style={{
        background: "rgba(16,16,16,0.11)", border: "none",
        borderRadius: 23, color: "#222",
        width: 56, height: 56, fontSize: 29,
        cursor: "pointer", marginBottom: 3,
        boxShadow: "0 2px 10px #0001"
      }}>
        {icon}
      </button>
    </div>
  );
}
