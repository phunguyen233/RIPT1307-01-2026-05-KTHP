import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import shopApiClient from '../api/shopApiClient';
import Breadcrumbs from '../components/Breadcrumbs';
import { ShoppingCart, Minus, Plus, Coffee, LayoutGrid, Leaf, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

interface Product {
  id: number;
  name: string;
  price: number;
  image_url: string;
  description: string;
  category_id: number;
  category_name?: string;
  ingredients?: { ingredient_name: string; quantity: number; unit_symbol: string }[];
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

  const handleAddToCart = () => {
    if (!product) return;
    try {
      const raw = localStorage.getItem("cart");
      const cart: Array<any> = raw ? JSON.parse(raw) : [];
      const existing = cart.find((c) => c.id === product.id);

      if (existing) {
        existing.quantity = (existing.quantity || 1) + quantity;
      } else {
        // Also map name to ten_san_pham just in case the Cart page expects it
        cart.push({ ...product, ten_san_pham: product.name, quantity: quantity });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      try { window.dispatchEvent(new Event('cartChange')); } catch {}
      
      toast.success(
        <div>
          <div className="font-bold text-gray-800 text-base mb-1">Thành công</div>
          <div className="text-gray-600 text-sm">Sản phẩm được thêm thành công vào giỏ hàng</div>
        </div>,
        {
          className: '!border-l-4 !border-green-500 !rounded-none !rounded-r-md',
        }
      );
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi thêm vào giỏ hàng.');
    }
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
            <div className="flex flex-col md:flex-row gap-10 lg:gap-16 mb-10 items-start justify-center max-w-5xl mx-auto">
              {/* Product Image */}
              <div className="w-full md:w-5/12 lg:w-1/3 flex-shrink-0 mx-auto">
                <div className="aspect-[4/5] md:aspect-square w-full overflow-hidden bg-secondary/30 rounded-2xl relative shadow-sm">
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
              <div className="w-full md:w-7/12 lg:w-2/3 flex flex-col items-start text-left pt-2 lg:pt-4">
                <h1 className="text-xl lg:text-2xl font-semibold text-text uppercase tracking-wider mb-4 w-full text-left">
                  {product.name}
                </h1>
                <p className="text-2xl font-bold text-green-600 mb-10 w-full text-left">
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
                  
                  <button 
                    onClick={handleAddToCart}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 text-sm rounded-full font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    THÊM VÀO GIỎ
                  </button>
                </div>

                {/* Details Table */}
                <div className="text-sm w-full mt-4">
                  <div className="flex items-center py-3 border-b border-secondary/50">
                    <div className="w-44 shrink-0 flex items-center gap-1.5 font-bold text-text/80">
                      <Coffee className="w-4 h-4 text-text/60" />
                      Tên sản phẩm:
                    </div>
                    <span className="text-text/70">{product.name}</span>
                  </div>
                  <div className="flex items-center py-3 border-b border-secondary/50">
                    <div className="w-44 shrink-0 flex items-center gap-1.5 font-bold text-text/80">
                      <LayoutGrid className="w-4 h-4 text-text/60" />
                      Danh mục:
                    </div>
                    <span className="text-text/70 capitalize">{product.category_name || 'Đang cập nhật'}</span>
                  </div>
                  <div className="flex items-center py-3 border-b border-secondary/50">
                    <div className="w-44 shrink-0 flex items-center gap-1.5 font-bold text-text/80">
                      <Leaf className="w-4 h-4 text-text/60" />
                      Thành phần:
                    </div>
                    <span className="text-text/70">
                      {product.ingredients && product.ingredients.length > 0 
                        ? product.ingredients.map(i => i.ingredient_name).join(', ')
                        : 'Đang cập nhật'}
                    </span>
                  </div>
                  <div className="flex items-center py-3 border-b border-secondary/50">
                    <div className="w-44 shrink-0 flex items-center gap-1.5 font-bold text-text/80">
                      <Clock className="w-4 h-4 text-text/60" />
                      Thời gian chuẩn bị:
                    </div>
                    <span className="text-text/70">5 - 10 phút</span>
                  </div>
                  <div className="flex items-start py-3">
                    <div className="w-44 shrink-0 flex items-center gap-1.5 font-bold text-text/80">
                      <ShieldCheck className="w-4 h-4 text-text/60" />
                      Bảo quản:
                    </div>
                    <span className="text-text/70 pt-[2px]">Dùng ngon nhất trong vòng 24 giờ. Vui lòng bảo quản lạnh.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tabs Section */}
            <div className="border-t border-secondary pt-6 mb-16">
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
