import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import shopApiClient from '../api/shopApiClient';
import Breadcrumbs from '../components/Breadcrumbs';
import { ShoppingCart, Minus, Plus } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description: string;
  category_id: number;
  category_name?: string;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [userName, setUserName] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

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

    const fetchProduct = async () => {
      try {
        // Lấy shop_id từ URL nếu có để filter hoặc tracking
        const urlParams = new URLSearchParams(window.location.search);
        const urlShopId = urlParams.get('shop_id');
        let url = `/products/${id}`;
        if (urlShopId) {
          url += `?shop_id=${urlShopId}`;
        }

        const response = await shopApiClient.get(url);
        setProduct(response.data.data || response.data);
      } catch (error) {
        console.error("Error fetching product details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  return (
    <div className="min-h-screen flex flex-col font-primary bg-surface selection:bg-warning/30 selection:text-primary">
      
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-danger"></div>
          </div>
        ) : !product ? (
          <div className="text-center py-16 text-text/50">
            Không tìm thấy sản phẩm.
          </div>
        ) : (
          <>
            <Breadcrumbs currentName={product?.name || undefined} />

            {/* Product Top Section */}
            <div className="flex flex-col md:flex-row gap-12 lg:gap-20 mb-20">
              {/* Product Image */}
              <div className="w-full md:w-5/12 lg:w-1/3 flex-shrink-0 mx-auto md:mx-0">
                <div className="aspect-[4/5] md:aspect-square w-full max-w-sm mx-auto overflow-hidden bg-secondary/30 rounded-xl relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
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
              </div>

              {/* Product Info */}
              <div className="flex-grow flex flex-col justify-start pt-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-text uppercase tracking-wider mb-4">
                  {product.name}
                </h1>
                <p className="text-2xl font-bold text-danger mb-10">
                  {formatPrice(product.price)}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-6 mb-12">
                  <div className="flex items-center gap-4">
                    <span className="text-text font-medium">Số lượng:</span>
                    <div className="flex items-center border border-secondary rounded-full overflow-hidden bg-white">
                      <button 
                        onClick={handleDecrease}
                        className="p-3 text-text hover:bg-secondary/50 transition-colors focus:outline-none"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input 
                        type="number" 
                        value={quantity}
                        readOnly
                        className="w-12 text-center text-text font-medium bg-transparent border-none focus:ring-0 p-0" 
                      />
                      <button 
                        onClick={handleIncrease}
                        className="p-3 text-text hover:bg-secondary/50 transition-colors focus:outline-none"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <button className="flex items-center gap-2 bg-danger hover:bg-danger/90 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                    <ShoppingCart className="w-5 h-5" />
                    THÊM VÀO GIỎ
                  </button>
                </div>

                {/* Details Table */}
                <div className="text-sm">
                  <div className="flex py-3 border-b border-secondary/50">
                    <span className="w-32 font-bold text-text/80">Tên sản phẩm:</span>
                    <span className="text-text/70">{product.name}</span>
                  </div>
                  <div className="flex py-3 border-b border-secondary/50">
                    <span className="w-32 font-bold text-text/80">Quy cách:</span>
                    <span className="text-text/70">Chưa có thông tin</span>
                  </div>
                  <div className="flex py-3 border-b border-secondary/50">
                    <span className="w-32 font-bold text-text/80">Thành phần:</span>
                    <span className="text-text/70">Chưa có thông tin</span>
                  </div>
                  <div className="flex py-3">
                    <span className="w-32 font-bold text-text/80">Hạn sử dụng:</span>
                    <span className="text-text/70">Chưa có thông tin</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tabs Section */}
            <div className="border-t border-secondary pt-10 mb-16">
              <div className="flex justify-center gap-8 md:gap-16 border-b border-secondary pb-4 mb-8">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`text-base font-bold transition-colors relative ${activeTab === 'description' ? 'text-text' : 'text-text/50 hover:text-text'}`}
                >
                  Mô tả
                  {activeTab === 'description' && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-danger"></span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`text-base font-bold transition-colors relative ${activeTab === 'details' ? 'text-text' : 'text-text/50 hover:text-text'}`}
                >
                  Thông tin chi tiết
                  {activeTab === 'details' && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-danger"></span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`text-base font-bold transition-colors relative ${activeTab === 'reviews' ? 'text-text' : 'text-text/50 hover:text-text'}`}
                >
                  Đánh giá
                  {activeTab === 'reviews' && (
                    <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-danger"></span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="max-w-4xl mx-auto">
                {activeTab === 'description' && (
                  <div className="animate-fade-in text-text/80 leading-relaxed text-justify whitespace-pre-wrap">
                    {product.description || "Chưa có mô tả cho sản phẩm này."}
                  </div>
                )}
                {activeTab === 'details' && (
                  <div className="animate-fade-in text-text/80 text-center py-10">
                    Chưa có thông tin chi tiết.
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <div className="animate-fade-in text-text/80 text-center py-10">
                    Chưa có đánh giá nào.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ProductDetails;
