import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeaturedProducts from '../components/FeaturedProducts';
import Footer from '../components/Footer';

type HomePageProps = {
  onLogout: () => void;
};

const HomePage = ({ onLogout }: HomePageProps) => {
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
    <div className="min-h-screen flex flex-col font-primary bg-surface selection:bg-warning/30 selection:text-primary">
      <Navbar onLogout={onLogout} userName={userName || 'Khách hàng'} />
      <main className="flex-grow">
        <Hero />
        <FeaturedProducts />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
