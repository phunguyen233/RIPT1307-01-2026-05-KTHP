import React from 'react';
import { Coffee, ShoppingBag, LogOut } from 'lucide-react';

const Navbar = ({ onLogout, userName }: { onLogout: () => void, userName: string }) => {
  return (
    <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-2 cursor-pointer">
            <Coffee className="w-8 h-8 text-primary" />
            <span className="font-display font-bold text-2xl text-primary tracking-tight">Cofee & Co.</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-primary font-medium hover:text-warning transition-colors">Trang chủ</a>
            <a href="#menu" className="text-text font-medium hover:text-warning transition-colors">Thực đơn</a>
            <a href="#about" className="text-text font-medium hover:text-warning transition-colors">Về chúng tôi</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-text hover:bg-secondary rounded-full transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">2</span>
            </button>
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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
