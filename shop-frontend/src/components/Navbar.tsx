import React from 'react';
import { Coffee, ShoppingBag, LogOut, LogIn } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const Navbar = ({ onLogout, userName }: { onLogout: () => void, userName?: string | null }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2 cursor-pointer">
            <Coffee className="w-8 h-8 text-primary" />
            <span className="font-display font-bold text-2xl text-primary tracking-tight">Cofee & Co.</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to={`/${location.search}`} className="text-text font-medium hover:text-danger transition-colors uppercase text-sm">Trang chủ</Link>
            <Link to={`/products${location.search}`} className="text-text font-medium hover:text-danger transition-colors uppercase text-sm border-b-2 border-transparent hover:border-danger">Sản phẩm</Link>
            <a href={`#news`} className="text-text font-medium hover:text-danger transition-colors uppercase text-sm">Tin tức</a>
            <a href={`#about`} className="text-text font-medium hover:text-danger transition-colors uppercase text-sm">Giới thiệu</a>
            <a href={`#contact`} className="text-text font-medium hover:text-danger transition-colors uppercase text-sm">Liên hệ</a>
          </div>

          <div className="flex items-center gap-4">
            {/* Giỏ hàng (Ai cũng xem được) */}
            <button className="p-2 text-text hover:bg-secondary rounded-full transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
            </button>
            
            {/* LƯỚI LỌC: Kiểm tra xem có userName truyền vào không */}
            {userName ? (
              /* NẾU CÓ TÊN (ĐÃ ĐĂNG NHẬP): Hiện cục thông tin + Nút đăng xuất */
              <div className="flex items-center gap-3 border-l border-secondary pl-4">
                 <div className="hidden sm:block text-right">
                   <p className="text-sm font-bold text-primary">{userName}</p>
                   <p className="text-xs text-text/70">Thành viên</p>
                 </div>
                 <button 
                  onClick={onLogout}
                  className="p-2 text-text hover:bg-danger/10 hover:text-danger rounded-full transition-colors"
                  title="Đăng xuất"
                 >
                   <LogOut className="w-5 h-5" />
                 </button>
              </div>
            ) : (
              /* NẾU KHÔNG CÓ TÊN (KHÁCH VÃNG LAI): Hiện nút Đăng nhập xịn xò */
              <div className="flex items-center gap-3 border-l border-secondary pl-4">
                <button 
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;