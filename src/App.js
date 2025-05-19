import React from 'react';
import { Route, Routes, Navigate, useLocation } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import Header from './components/Header';
import Feed from './components/Feed';
import Explore from './components/Explore';
import Shorts from './components/Shorts';
import Messages from './components/Messages';
import MyPage from './components/MyPage';
import Login from './components/Login';
import Join from './components/Join';
import Register from './components/Register';

export default function App() {
  const location = useLocation();
  // 로그인, 회원가입 페이지에서는 메뉴+헤더 숨김
  const isAuthPage = ['/login', '/join'].includes(location.pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>
      {/* 사이드 메뉴 (로그인/회원가입 땐 숨김) */}
      {!isAuthPage && (
        <div style={{ width: 240, flexShrink: 0, background: "#f6f6f6" }}>
          <MainMenu />
        </div>
      )}
      {/* 오른쪽 전체 (헤더 + 컨텐츠) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#fff' }}>
        {/* 헤더도 로그인/회원가입 땐 숨김 */}
        {!isAuthPage && <Header />}
        <div style={{ flex: 1, overflow: 'auto', background: '#fff' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/feed" />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/upload" element={<Register />} />
            <Route path="/shorts" element={<Shorts />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile/me" element={<MyPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/join" element={<Join />} />
            {/* 필요하면 추가 라우트 여기에 쭉 넣으면 됨 */}
          </Routes>
        </div>
      </div>
    </div>
  );
}

