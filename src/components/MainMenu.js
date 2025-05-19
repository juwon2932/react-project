import { useState, useEffect } from 'react';
import { Home, MapPin, PlusCircle, VideoIcon, Bell, User, LogIn, UserPlus, LogOut, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export default function MainMenu({ openPixoEditor }) {
    const [active, setActive] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // ✅ 로그인 상태 체크 (토큰 + 세션)
        const token = localStorage.getItem("token");
        const user = sessionStorage.getItem("user");

        if (token && user) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                const exp = payload.exp * 1000;
                const isValid = Date.now() < exp;

                console.log("✅ 세션 상태:");
                console.log("User:", user);
                console.log("Token Expiration:", new Date(exp).toLocaleString());
                console.log("Current Time:", new Date().toLocaleString());
                console.log("Token Valid:", isValid);

                setIsLoggedIn(isValid);
            } catch (e) {
                console.error("⚠️ 토큰 검증 오류:", e);
                setIsLoggedIn(false);
            }
        } else {
            setIsLoggedIn(false);
        }
    }, []);

    const handleLogout = () => {
        // ✅ 로컬 스토리지에서 토큰 제거
        localStorage.removeItem("token");
        localStorage.removeItem("userId");

        // ✅ 세션 스토리지에서 사용자 정보 제거
        sessionStorage.removeItem("user");

        // ✅ 상태 초기화
        setIsLoggedIn(false);

        // ✅ 로그인 페이지로 이동
        navigate("/login");
    };

    const menuItems = [
        { text: '메인', icon: <Home size={20} />, path: '/feed' },
        // { text: '주변', icon: <MapPin size={20} />, path: '/explore' },
        { text: '글쓰기', icon: <PlusCircle size={20} />, path: '/upload' },
        { text: '쇼츠', icon: <VideoIcon size={20} />, path: '/shorts' },
        { text: '메세지', icon: <Bell size={20} />, path: '/messages' },
        { text: '내 정보', icon: <User size={20} />, path: '/profile/me' },
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '240px',
            height: '100vh',
            backgroundColor: '#f2f2f2',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 0',
            justifyContent: 'space-between',
            fontFamily: 'Poppins, sans-serif'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <img src="/img/logo.png" alt="Echo Logo" style={{ width: '160px', marginBottom: '10px' }} />
            </div>
            <div style={{ padding: '0 20px', marginTop: '-20px' }}>
                {menuItems.map((item) => (
                    <div
                        key={item.text}
                        onClick={() => {
                            if (item.path) {
                                navigate(item.path);
                                setActive(item.text);
                            } else if (item.action) {
                                item.action();
                            }
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: active === item.text ? '#000000' : '#777777',
                            cursor: 'pointer',
                            padding: '10px 20px',
                            fontSize: '18px',
                            fontWeight: active === item.text ? 'bold' : 'normal',
                            borderRadius: '12px',
                            backgroundColor: active === item.text ? '#ffffff' : 'transparent',
                            marginBottom: '15px'
                        }}
                    >
                        {item.icon}
                        <span style={{ marginLeft: '15px', fontSize: '18px' }}>{item.text}</span>
                    </div>
                ))}
            </div>

            {/* 로그인 / 회원가입 / 로그아웃 */}
            <div style={{ padding: '30px', borderTop: '1px solid #cccccc', marginBottom: '20px' }}>
                {isLoggedIn ? (
                    <motion.div
                        onClick={handleLogout}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            color: '#777777',
                            transition: 'color 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#000000'}
                        onMouseLeave={(e) => e.target.style.color = '#777777'}
                    >
                        <LogOut size={20} />
                        <span style={{ marginLeft: '15px', fontSize: '18px' }}>로그아웃</span>
                    </motion.div>
                ) : (
                    <>
                        <Link to="/login" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', marginBottom: '20px', color: '#777777', transition: 'color 0.3s' }}
                            onMouseEnter={(e) => e.target.style.color = '#000000'}
                            onMouseLeave={(e) => e.target.style.color = '#777777'}>
                            <LogIn size={20} />
                            <span style={{ marginLeft: '15px', fontSize: '18px' }}>로그인</span>
                        </Link>
                        <Link to="/join" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: '#777777', transition: 'color 0.3s' }}
                            onMouseEnter={(e) => e.target.style.color = '#000000'}
                            onMouseLeave={(e) => e.target.style.color = '#777777'}>
                            <UserPlus size={20} />
                            <span style={{ marginLeft: '15px', fontSize: '18px' }}>회원가입</span>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
