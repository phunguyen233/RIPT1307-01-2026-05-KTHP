  import React, { useEffect, useState } from 'react';
  import { motion } from 'framer-motion';
  import { ShoppingBag } from 'lucide-react';
  import { Link } from 'react-router-dom';
  import shopApiClient from '../api/shopApiClient';

  interface Product {
    id: number;
    name: string;
    price: number;
    image_url: string;
    is_active: boolean;
  }

  const FeaturedProducts = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchProducts = async () => {
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const urlShopId = urlParams.get('shop_id');

          let url = '/products?is_active=true&limit=8';
          
          if (urlShopId) {
            url += `&shop_id=${urlShopId}`;
          }

          const response = await shopApiClient.get(url);
          setProducts(response.data.data);
        } catch (error) {
          console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchProducts();
    }, []);

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
      <div className="bg-secondary/30 py-20" id="menu">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-primary mb-4">Món Nổi Bật</h2>
            <p className="text-text/70 max-w-2xl mx-auto">Những thức uống được yêu thích nhất tại quán, pha chế từ những hạt cà phê rang xay thượng hạng.</p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-text/70 py-10">Hiện chưa có sản phẩm nào.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <Link to={`/products/details/${product.id}${window.location.search}`} key={product.id} className="block group">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-surface rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group cursor-pointer border border-secondary flex flex-col"
                >
                  <div className="relative h-64 overflow-hidden bg-secondary/50">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <button className="bg-surface text-primary px-6 py-2 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-lg hover:scale-105">
                        Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <h3 className="text-lg font-bold text-primary mb-2 group-hover:text-warning transition-colors line-clamp-2">{product.name}</h3>
                    <div className="flex justify-between items-center mt-4">
                      <span className="font-bold text-warning text-xl">{formatPrice(product.price)}</span>
                      <button className="bg-secondary hover:bg-primary hover:text-surface text-primary p-3 rounded-full transition-colors shadow-sm shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts;
