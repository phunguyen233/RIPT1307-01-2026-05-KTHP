import React from 'react';
import { Coffee } from 'lucide-react';

const Footer = () => (
  <footer className="bg-primary text-secondary py-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Coffee className="w-6 h-6 text-warning" />
          <span className="font-display font-bold text-xl text-surface">Cofee & Co.</span>
        </div>
        <p className="text-secondary/80 max-w-sm">
          Mang đến trải nghiệm cà phê tuyệt vời nhất với không gian ấm cúng và hương vị khó quên.
        </p>
      </div>
      <div>
        <h4 className="font-bold text-surface text-lg mb-4">Liên Kết</h4>
        <ul className="space-y-2">
          <li><a href="#home" className="text-secondary/80 hover:text-warning transition-colors">Trang chủ</a></li>
          <li><a href="#menu" className="text-secondary/80 hover:text-warning transition-colors">Thực đơn</a></li>
          <li><a href="#about" className="text-secondary/80 hover:text-warning transition-colors">Về chúng tôi</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-bold text-surface text-lg mb-4">Liên Hệ</h4>
        <ul className="space-y-2 text-secondary/80">
          <li>📍 123 Đường Cà Phê, Quận 1, TP.HCM</li>
          <li>📞 0123 456 789</li>
          <li>✉️ hello@coffeeco.vn</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-secondary/20 text-center text-secondary/60">
      <p>&copy; {new Date().getFullYear()} Cofee & Co. Tất cả quyền được bảo lưu.</p>
    </div>
  </footer>
);

export default Footer;
