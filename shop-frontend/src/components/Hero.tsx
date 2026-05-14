import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';

const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-surface py-20 lg:py-32" id="home">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl lg:text-7xl font-display font-black text-primary leading-tight mb-6">
              Hương vị <br/>
              <span className="text-warning">đánh thức</span><br/>
              mọi giác quan
            </h1>
            <p className="text-lg text-text/80 mb-8 max-w-lg">
              Trải nghiệm cà phê nguyên chất được rang xay thủ công, mang đến cho bạn sự tỉnh táo và năng lượng cho cả ngày dài.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-primary hover:bg-primary/90 text-surface px-8 py-4 rounded-full font-medium transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg shadow-primary/30">
                Đặt hàng ngay
                <ChevronRight className="w-5 h-5" />
              </button>
              <button className="bg-secondary text-primary px-8 py-4 rounded-full font-medium hover:bg-secondary/80 transition-all">
                Xem thực đơn
              </button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
             <div className="absolute inset-0 bg-secondary rounded-full filter blur-3xl opacity-50 transform translate-x-10 -translate-y-10"></div>
             <img 
               src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
               alt="Cà phê" 
               className="relative z-10 rounded-3xl shadow-2xl object-cover h-[500px] w-full border-8 border-surface"
             />
             
             <motion.div 
               animate={{ y: [0, -15, 0] }}
               transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
               className="absolute -bottom-6 -left-6 bg-surface p-4 rounded-2xl shadow-xl flex items-center gap-4 z-20 border border-secondary"
             >
                <div className="bg-warning/20 p-3 rounded-full text-warning">
                  <Star className="fill-current w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-primary text-xl">4.9/5</p>
                  <p className="text-sm text-text/70">Đánh giá khách hàng</p>
                </div>
             </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
