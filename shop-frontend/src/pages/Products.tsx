import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import shopApiClient from '../api/shopApiClient';
import { Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type ProductsProps = {
  onLogout: () => void;
};

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description: string;
  category_id: number;
}

const Products = ({ onLogout }: ProductsProps) => {
  const [userName, setUserName] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserName(user.ho_ten || user.name || user.ten_dang_nhap || null);
      } catch {
        setUserName(null);
      }
    }

    const fetchData = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlShopId = urlParams.get('shop_id');
        
        let catUrl = '/categories';
        let prodUrl = '/products';
        
        if (urlShopId) {
          catUrl += `?shop_id=${urlShopId}`;
          prodUrl += `?shop_id=${urlShopId}`;
        }

        const [catRes, prodRes] = await Promise.all([
          shopApiClient.get(catUrl),
          shopApiClient.get(prodUrl)
        ]);
        
        setCategories(catRes.data.data || catRes.data || []);
        setProducts(prodRes.data.data || prodRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id === activeCategory);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  return (
    <div className="min-h-screen flex flex-col font-primary bg-surface selection:bg-warning/30 selection:text-primary">
      <Navbar onLogout={onLogout} userName={userName} />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text/60 mb-10">
          <Link to={`/${window.location.search}`} className="flex items-center gap-1 hover:text-danger transition-colors">
            <Home className="w-4 h-4" />
            <span className="font-semibold text-text">Trang chủ</span>
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-text/60">Sản phẩm</span>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <h2 className="text-lg font-bold text-text uppercase tracking-wider mb-6 inline-block border-b-2 border-danger pb-1">
              Loại sản phẩm
            </h2>
            <ul className="flex flex-col">
              <li>
                <button
                  onClick={() => setActiveCategory('all')}
                  className={`w-full text-left py-3 border-b border-secondary transition-colors ${
                    activeCategory === 'all' 
                      ? 'font-bold text-text' 
                      : 'text-text/70 hover:text-danger'
                  }`}
                >
                  Tất cả
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => setActiveCategory(cat.id)}
                    className={`w-full text-left py-3 border-b border-secondary transition-colors ${
                      activeCategory === cat.id 
                        ? 'font-bold text-text' 
                        : 'text-text/70 hover:text-danger'
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content */}
          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-text uppercase tracking-wider mb-8">
              Danh sách sản phẩm
            </h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-danger"></div>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="group cursor-pointer">
                    <div className="h-64 w-full overflow-hidden bg-secondary/50 mb-4 rounded-xl relative">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            // Nếu ảnh lỗi, ẩn đi hoặc hiển thị một div trống
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                               parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-text/30 bg-secondary/30">Không có ảnh</div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text/30 bg-secondary/30">
                          Không có ảnh
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="text-sm font-semibold text-text group-hover:text-danger transition-colors mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm font-bold text-text">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-text/50">
                Không tìm thấy sản phẩm nào trong danh mục này.
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
