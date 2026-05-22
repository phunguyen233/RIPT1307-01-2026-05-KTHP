import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import Auth from './pages/Auth';
import './App.css';

type HomePageProps = {
  onLogout: () => void;
};

function HomePage({ onLogout }: HomePageProps) {
  const [userName, setUserName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.ho_ten || user.name || user.ten_dang_nhap || 'Khách hàng');
      } catch {
        setUserName('Khách hàng');
      }
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Chào mừng đến với cửa hàng</h1>
        <p>Xin chào, {userName || 'Khách hàng'}!</p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => navigate('/auth')}
            style={{ padding: '10px 18px', borderRadius: '6px', border: '1px solid #fff', background: 'transparent', color: '#fff' }}
          >
            Thay đổi tài khoản
          </button>
          <button
            type="button"
            onClick={onLogout}
            style={{ padding: '10px 18px', borderRadius: '6px', border: 'none', background: '#61dafb', color: '#111' }}
          >
            Đăng xuất
          </button>
        </div>
      </header>
    </div>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));

  useEffect(() => {
    const handleAuthChange = () => setToken(localStorage.getItem('token'));
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={token ? <HomePage onLogout={handleLogout} /> : <Navigate to="/auth" replace />}
        />
        <Route path="*" element={<Navigate to={token ? '/' : '/auth'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;