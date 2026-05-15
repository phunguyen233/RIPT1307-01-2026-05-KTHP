import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import Footer from '../components/Footer';

type HomePageProps = {
  onLogout: () => void;
};

const HomePage = ({ onLogout }: HomePageProps) => {
  // Để mặc định là null (chưa đăng nhập)
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        // Chỉ lấy tên thật hoặc tên đăng nhập
        setUserName(user.ho_ten || user.name || user.ten_dang_nhap || null);
      } catch {
        setUserName(null); // Lỗi két sắt thì coi như chưa đăng nhập
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-primary bg-surface selection:bg-warning/30 selection:text-primary">
      {/* Bỏ cái || 'Khách hàng' đi để Navbar nó tự biết đường hiện nút Đăng nhập */}
      <Navbar onLogout={onLogout} userName={userName} />
      <main className="flex-grow">
        <Hero />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;