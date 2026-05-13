import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import Auth from './pages/Auth';
import AboutPage from './pages/About';
import Contact from './pages/Contact';
import BranchPage from './pages/Branches';
import './App.css';

type HomePageProps = {
  onLogout: () => void;
};

function Navigation({ isLoggedIn, userName, onLogout }: { isLoggedIn: boolean; userName: string; onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="text-2xl font-bold text-green-600 cursor-pointer" onClick={() => navigate('/')}>
          🍃 Bếp Mầm
        </div>

        <div className="flex gap-6 items-center">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => navigate('/')}
                className={`px-4 py-2 ${location.pathname === '/' ? 'text-green-600 font-bold' : 'text-gray-700'} hover:text-green-600`}
              >
                Trang chủ
              </button>
              <button
                onClick={() => navigate('/about')}
                className={`px-4 py-2 ${location.pathname === '/about' ? 'text-green-600 font-bold' : 'text-gray-700'} hover:text-green-600`}
              >
                Về chúng tôi
              </button>
              <button
                onClick={() => navigate('/branches')}
                className={`px-4 py-2 ${location.pathname === '/branches' ? 'text-green-600 font-bold' : 'text-gray-700'} hover:text-green-600`}
              >
                Chi nhánh
              </button>
              <button
                onClick={() => navigate('/contact')}
                className={`px-4 py-2 ${location.pathname === '/contact' ? 'text-green-600 font-bold' : 'text-gray-700'} hover:text-green-600`}
              >
                Liên hệ
              </button>
              <div className="border-l pl-6 flex gap-4">
                <span className="text-gray-700">Xin chào, {userName}!</span>
                <button
                  onClick={onLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-5xl font-bold text-green-700 mb-4">Bếp Mầm</h1>
            <p className="text-xl text-gray-600 mb-6">
              Sữa hạt, nước ép, detox - Những sản phẩm tốt cho sức khỏe từ Bếp Mầm
            </p>
            <button
              onClick={() => navigate('/about')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Tìm hiểu thêm
            </button>
          </div>
          <div className="h-96 bg-green-200 rounded-3xl shadow-lg"></div>
        </div>
      </section>
    </div>
  );
}

function AppContent({ token, onLogout }: { token: string | null; onLogout: () => void }) {
  const [userName, setUserName] = useState<string>('');

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
    <>
      {token && <Navigation isLoggedIn={true} userName={userName} onLogout={onLogout} />}
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={token ? <HomePage onLogout={onLogout} /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/about"
          element={token ? <AboutPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/contact"
          element={token ? <Contact /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/branches"
          element={token ? <BranchPage /> : <Navigate to="/auth" replace />}
        />
        <Route path="*" element={<Navigate to={token ? '/' : '/auth'} replace />} />
      </Routes>
    </>
  );
}

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
      <AppContent token={token} onLogout={handleLogout} />
    </BrowserRouter>
  );
}

export default App;
