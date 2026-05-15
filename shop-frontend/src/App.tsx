import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';
import HomePage from './pages/HomePage';

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = () => setToken(localStorage.getItem('token'));
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('authChange'));
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* TRANG ĐĂNG NHẬP / ĐĂNG KÝ */}
        <Route path="/auth" element={<Auth />} />
        
        {/* KHU VỰC CÔNG CỘNG: Mở toang cửa cho khách vào HomePage xem Menu */}
        <Route
          path="/"
          element={<HomePage onLogout={handleLogout} />} 
        />
        
        {/* NẾU KHÁCH GÕ LINK BẬY BẠ: Đẩy về trang chủ cho an toàn */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;