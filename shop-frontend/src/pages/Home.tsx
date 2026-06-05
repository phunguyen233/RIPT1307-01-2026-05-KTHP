import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { ShoppingCart, Heart, Star } from "lucide-react";
import { Product } from "../types/Product";
import CartProduct from "../components/cartProduct";
import productsAPI from "../api/productsAPI";
import { API_KEY } from "../api/shopApiClient";
import { resolveImageUrl } from "../api/imageHelper";

export default function Home() {
  const images = [
    "/assets/slide1.jpg",
    "/assets/slide2.jpg",
    "/assets/slide3.jpg",
  ];

  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1: next, -1: prev
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      if (!API_KEY) {
        console.warn("API Key không được cấu hình trong .env");
        return;
      }
      console.log("Fetching products with API key:", API_KEY.substring(0, 10) + "...");
      const res = await productsAPI.getAll();
      console.log("Products response:", res);
      const mapped: Product[] = res.map((row: any) => ({
        id: row.id,
        ten_san_pham: row.name,
        gia_ban: row.price,
        so_luong_ton: row.stock_quantity || 0,
        hinh_anh: row.image_url,
        mo_ta: row.description,
        hien_thi: row.is_active,
        created_at: row.created_at,
      }));
      console.log("Mapped products:", mapped);
      setProducts(mapped);
    } catch (err: any) {
      console.error("Lỗi khi lấy sản phẩm:", err);
      if (err.response?.status === 401) {
        console.error("API Key không hợp lệ. Vui lòng kiểm tra REACT_APP_SHOP_API_KEY trong file .env");
      }
    }
  };

  // Auto change slide every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % images.length);
  };

  const goTo = (i: number) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  };

  const handleAddToCart = (product: Product) => {
    try {
      if (!product.hien_thi) {
        toast.error('Sản phẩm hiện không có sẵn để đặt (đang ẩn).');
        return;
      }
      const raw = localStorage.getItem("cart");
      const cart: Array<any> = raw ? JSON.parse(raw) : [];
      const existing = cart.find((c) => c.id === product.id);
      if (existing) {
        const nextQty = (existing.quantity || 1) + 1;
        existing.quantity = nextQty;
      } else {
        cart.push({ ...product, quantity: 1 });
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      // notify other parts of the app (same-tab) that cart changed
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
    } catch (err) {
      console.error("Lỗi khi thêm vào giỏ hàng:", err);
    }
  };

  // Slide animation variants
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const isNewProduct = (dateStr?: string) => {
    if (!dateStr) return false;
    const createdDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  return (
    <div className="w-full">
      {/* SLIDER */}
      <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden rounded-b-3xl shadow-lg">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={images[index]}
            alt="Slide"
            className="absolute w-full h-full object-cover"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* DOTS */}
        <div className="absolute bottom-6 w-full flex justify-center gap-3">
          {images.map((_, i) => (
            <div
              key={i}
              onClick={() => goTo(i)}
              className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
                index === i ? "bg-white scale-125" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Centered pill header with horizontal lines (under slider) */}
      <div className="w-full flex items-center justify-center my-6">
        <div className="flex items-center w-full max-w-5xl px-4">
          <div className="flex-1 border-t border-green-600/70"></div>
          <div className="mx-4">
            <div className="bg-green-600 text-white px-8 py-2 rounded-full font-semibold text-sm tracking-wider">
              LIỆU TRÌNH DETOX THON DÁNG
            </div>
          </div>
          <div className="flex-1 border-t border-green-600/70"></div>
        </div>
      </div>

      {/* FEATURED DESIGN: Liệu trình + product showcase */}
      <div className="p-6 md:p-10">
        {/* Top green plan boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[
            { title: 'LIỆU TRÌNH DETOX 6 NGÀY', text: 'Chỉ với 6 ngày dùng Detox ép chậm để giảm cân bạn sẽ cảm thấy cơ thể "nhẹ" đi đáng kể' },
            { title: 'LIỆU TRÌNH DETOX 3 NGÀY', text: 'Thon dáng an toàn tại nhà và hiệu quả trong 3 ngày nhưng vẫn đảm bảo đủ dưỡng chất nuôi cơ thể.' },
            { title: 'LIỆU TRÌNH BỔ SUNG CHẤT XƠ', text: 'Chất xơ đóng vai trò rất quan trọng trong việc duy trì sức khỏe đường tiêu hóa và điều chỉnh các chức năng cơ thể.' },
            { title: 'THANH LỌC THẢI ĐỘC (DÒNG M)', text: 'Detox dòng M chứa các thành phần: Thơm, Táo, Dưa leo mix với các loại rau như Cần tây, Dền hoặc Bó xôi.' },
            { title: 'THANH LỌC THẢI ĐỘC (DÒNG A)', text: 'Detox dòng A chứa thành phần chính là Gừng và được kết hợp với Thơm, Táo, Dưa Leo, Dền, Cam và Cà rốt.' },
          ].map((card, i) => (
            <div key={i} className="bg-green-600 text-white rounded-xl p-5 shadow-inner flex flex-col justify-center items-start">
              <h4 className="text-sm font-bold mb-2">{card.title}</h4>
              <p className="text-xs leading-snug">{card.text}</p>
            </div>
          ))}
        </div>

        {/* Three benefit icons row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start mb-8">
          <div className="flex items-start gap-4">
            <div>
              <h5 className="font-bold">TĂNG CƯỜNG HỆ MIỄN DỊCH</h5>
              <p className="text-sm text-muted-foreground">Liệu trình như uống nước ép, detox và sinh tố giàu vitamin, khoáng chất sẽ giúp cải thiện chức năng hệ miễn dịch.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div>
              <h5 className="font-bold">CẢI THIỆN HỆ TIÊU HÓA</h5>
              <p className="text-sm text-muted-foreground">Trong trái cây chứa nhiều chất xơ, việc nạp sinh tố sẽ giúp cải thiện hoạt động hệ tiêu hóa và tăng khả năng hấp thu dinh dưỡng.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div>
              <h5 className="font-bold">BỔ SUNG VITAMIN & KHOÁNG CHẤT</h5>
              <p className="text-sm text-muted-foreground">Cung cấp đầy đủ các vitamin, khoáng chất và chất dinh dưỡng giúp cải thiện giấc ngủ và tạo cảm giác tràn đầy năng lượng.</p>
            </div>
          </div>
        </div>

        {/* Centered title */}
        <div className="w-full flex flex-col items-center justify-center mb-10 mt-16">
          <div className="flex items-center w-full max-w-4xl px-4 mb-3">
            <div className="flex-1 border-t-2 border-green-700/20" />
            <div className="mx-4 flex items-center gap-3">
              <div className="bg-[#f0fdf4] text-green-700 border border-green-200 px-8 py-2 rounded-full font-bold text-[17px] tracking-wide shadow-sm">
                NHẤT ĐỊNH PHẢI THỬ
              </div>
            </div>
            <div className="flex-1 border-t-2 border-green-700/20" />
          </div>
          <p className="text-gray-500 font-medium text-[15px]">Những món đồ uống được yêu thích nhất</p>
        </div>

        {/* Product showcase (use fetched products, styled like provided image) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 lg:gap-6 px-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            products.slice(0,5).map((p) => (
                <div key={p.id} className="p-2 w-full max-w-[240px] mx-auto">
                  <div
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden transition border border-gray-200"
                    style={{
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transform: hoveredId === p.id ? "translateY(-6px)" : "none",
                      boxShadow: hoveredId === p.id ? "0px 10px 20px rgba(0,0,0,0.12)" : undefined,
                      transition: "transform 150ms ease, box-shadow 250ms ease",
                    }}
                  >
                    {/* Image (square 1:1) */}
                    <div
                      className="w-full mb-3 overflow-hidden rounded-xl cursor-pointer group"
                      style={{ position: "relative", width: "100%", paddingTop: "100%", }}
                      onClick={() => navigate(`/products/details/${p.id}`)}
                    >
                      {/* Badge "Mới" */}
                      {isNewProduct(p.created_at) && (
                        <div className="absolute top-3 left-3 z-10 bg-[#16a34a] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                          Mới
                        </div>
                      )}
                      
                      {/* Heart Icon */}
                      <button 
                        className="absolute top-2 right-2 z-10 bg-white p-1.5 rounded-full shadow-sm text-gray-500 hover:text-red-500 hover:bg-gray-50 transition-colors focus:outline-none"
                        onClick={(e) => { e.stopPropagation(); toast.success('Đã thêm vào danh sách yêu thích'); }}
                      >
                        <Heart className="w-4 h-4" />
                      </button>

                      <img
                        src={resolveImageUrl(p.hinh_anh)}
                        alt={p.ten_san_pham}
                        onError={(e: any) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 text-xs text-center border border-gray-200" style="position:absolute;top:0;left:0;right:0;bottom:0;border-radius:12px;">Không có ảnh</div>';
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: '12px'
                        }}
                        className="transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Info under the image */}
                    <div className="text-left px-1 flex-1 flex flex-col">
                      <h2 
                        className="font-bold text-[15px] mb-1.5 truncate text-gray-800 cursor-pointer hover:text-green-600 transition-colors"
                        onClick={() => navigate(`/products/details/${p.id}`)}
                      >
                        {p.ten_san_pham}
                      </h2>
                      
                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 mb-2.5">
                        <div className="flex text-yellow-400">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <Star className="w-3.5 h-3.5 fill-current text-yellow-400/50" />
                        </div>
                      </div>

                      <p className="text-gray-900 font-bold text-[16px] mb-4">{Number(p.gia_ban).toLocaleString()} ₫</p>

                      {/* Buttons row */}
                      <div className="mt-auto">
                        {(!p.hien_thi) ? (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2.5 text-[13px] bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed select-none font-medium"
                          >
                            Hết hàng
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleAddToCart(p); }}
                            className="w-full flex items-center justify-center gap-2 bg-[#127e36] hover:bg-green-700 text-white py-2.5 rounded-lg transition-colors duration-200 shadow-sm"
                            title="Thêm vào giỏ"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="text-[14px] font-medium">
                              Thêm vào giỏ
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
            ))
          )}
        </div>

        <div className="mt-12 flex justify-center">
          <Link to="/products" className="flex items-center gap-2 bg-[#f0fdf4] border border-[#d1fae5] text-[#16a34a] hover:bg-[#16a34a] hover:text-white px-6 py-2.5 rounded-full font-medium transition-colors group">
            Xem tất cả món
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </div>

      {selectedProduct && (
        <CartProduct
          product={selectedProduct as Product}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(prod) => handleAddToCart(prod)}
        />
      )}
    </div>
  );
}
