import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
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

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1: next, -1: prev
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

        {/* Centered pill title (decorated with horizontal lines) */}
        <div className="w-full flex items-center justify-center mb-8">
          <div className="flex items-center w-full max-w-5xl px-4">
            <div className="flex-1 border-t border-green-600/70" />
            <div className="mx-4 -mt-1">
              <div className="bg-green-600 text-white px-10 py-2 rounded-full font-semibold text-sm tracking-wider shadow-sm">
                NHẤT ĐỊNH PHẢI THỬ
              </div>
            </div>
            <div className="flex-1 border-t border-green-600/70" />
          </div>
        </div>

        {/* Product showcase (use fetched products, styled like provided image) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">Đang tải sản phẩm...</p>
            </div>
          ) : (
            products.slice(0,4).map((p) => (
              <Link key={p.id} to={`/products/details/${p.id}`} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center block hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-40 h-40 mx-auto mb-3 rounded-full overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img src={resolveImageUrl(p.hinh_anh)} alt={p.ten_san_pham} onError={(e:any)=>e.currentTarget.src='/placeholder.png'} className="w-full h-full object-contain" />
                </div>
                <div className="text-sm text-muted-foreground">NƯỚC ÉP</div>
                <div className="text-lg font-bold text-gray-800">{p.ten_san_pham}</div>
                <div className="mt-3 flex justify-center gap-2">
                  <div className="text-xs bg-gray-100 px-3 py-1 rounded-full">350ml</div>
                </div>
              </Link>
            ))
          )}
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
