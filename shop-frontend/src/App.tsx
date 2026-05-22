import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';
import HomePage from './pages/HomePage';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import OrderHistory from './pages/OrderHistory';
import About from './pages/About';
import Contact from './pages/Contact';
import Branches from './pages/Branches';
import './App.css';

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
        <Route path="/" element={<HomePage onLogout={handleLogout} />} />
        <Route path="/products" element={<Products onLogout={handleLogout} />} />
        <Route path="/product/:id" element={<ProductDetails onLogout={handleLogout} />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<OrderHistory />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;