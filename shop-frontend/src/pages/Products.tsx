import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Search, ShoppingCart, Heart, Star } from "lucide-react";
import Breadcrumbs from "../components/Breadcrumbs";
import { Product } from "../types/Product";
import { resolveImageUrl } from "../api/imageHelper";
import productsAPI from "../api/productsAPI";
import categoriesAPI from "../api/categoriesAPI";
import { API_KEY } from "../api/shopApiClient";

type ProductsProps = {
  onLogout?: () => void;
};

export default function Products({ onLogout }: ProductsProps) {
  const navigate = useNavigate();
  void onLogout;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [query, setQuery] = useState<string>("");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    if (!API_KEY) {
      setError("Chưa cấu hình API Key. Vui lòng thêm REACT_APP_SHOP_API_KEY vào file .env");
      return;
    }

    productsAPI.getAll()
      .then((res) => {
        const mapped: Product[] = (res || []).map((row: any) => ({
          id: row.id,
          ten_san_pham: row.name,
          gia_ban: row.price,
          so_luong_ton: row.stock_quantity || 0,
          hinh_anh: row.image_url,
          mo_ta: row.description,
          hien_thi: row.is_active,
          category_id: row.category_id,
        }));
        setProducts(mapped);
      })
      .catch((err) => {
        console.error("Lỗi khi lấy sản phẩm:", err);
        setError("Không thể kết nối shop. Vui lòng kiểm tra API Key.");
      })
      .finally(() => setLoading(false));

    categoriesAPI.getAll()
      .then(data => setCategories(data))
      .catch(err => console.error("Lỗi khi tải danh mục:", err));
  }, []);

  const handleAddToCart = (product: Product) => {
    try {
      // Prevent adding if product is hidden (admin can hide)
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

  const filteredProducts = products.filter((p) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || (p.ten_san_pham || "").toLowerCase().includes(search);
    const matchesCategory = selectedCategoryId === null || p.category_id === selectedCategoryId;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return Number(a.gia_ban) - Number(b.gia_ban);
    if (sortBy === "price_desc") return Number(b.gia_ban) - Number(a.gia_ban);
    return b.id - a.id; // newest (default)
  });

  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-green-600">Lỗi kết nối</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
    <div className="p-8 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        
        <div className="mt-8 flex flex-col md:flex-row gap-10">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 lg:w-1/5 shrink-0">
            <h3 className="text-[16px] font-bold uppercase text-[#1a2b3c] mb-6 relative inline-block">
              LOẠI SẢN PHẨM
              <span className="absolute -bottom-2 left-0 w-1/2 h-0.5 bg-green-500"></span>
            </h3>
            
            <div className="bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-2xl p-2.5">
              <ul className="flex flex-col text-[14px]">
                <li>
                  <button
                    className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-colors font-medium
                      ${selectedCategoryId === null 
                        ? 'bg-[#f0fdf4] text-[#16a34a]' 
                        : 'text-gray-600 hover:text-[#16a34a]'}`}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    <span>Tất cả</span>
                    <span className={`${selectedCategoryId === null ? 'text-[#16a34a]' : 'text-gray-500'}`}>
                      {products.length}
                    </span>
                  </button>
                </li>
                
                {categories.map((c: any, index: number) => {
                  const count = products.filter(p => p.category_id === c.id).length;
                  const isActive = selectedCategoryId === c.id;
                  const prevIsActive = index === 0 ? selectedCategoryId === null : selectedCategoryId === categories[index-1]?.id;
                  
                  return (
                    <React.Fragment key={c.id}>
                      {!(isActive || prevIsActive) && (
                        <div className="mx-4 border-t border-gray-100"></div>
                      )}
                      <li>
                        <button
                          className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-colors font-medium
                            ${isActive 
                              ? 'bg-[#f0fdf4] text-[#16a34a]' 
                              : 'text-gray-600 hover:text-[#16a34a]'}`}
                          onClick={() => setSelectedCategoryId(c.id)}
                        >
                          <span>{c.name}</span>
                          <span className={`${isActive ? 'text-[#16a34a]' : 'text-gray-500'}`}>
                            {count}
                          </span>
                        </button>
                      </li>
                    </React.Fragment>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <h3 className="text-[20px] font-bold uppercase text-gray-800">
                DANH SÁCH SẢN PHẨM
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
                  </div>
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50/50 text-sm w-full sm:w-56 rounded-full focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all duration-300"
                    aria-label="Tìm sản phẩm"
                  />
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 bg-gray-50/50 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 text-gray-600 font-medium cursor-pointer transition-all duration-300 appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto', paddingRight: '2.5rem' }}
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá: Thấp đến Cao</option>
                  <option value="price_desc">Giá: Cao đến Thấp</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 justify-items-center grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-500">
                  Không tìm thấy sản phẩm phù hợp.
                </div>
              ) : filteredProducts.map((p) => (
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
                      onClick={() => navigate(`/products/details/${p.id}${window.location.search}`)}
                    >
                      {/* Badge "Mới" */}
                      <div className="absolute top-2 left-2 z-10 bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        Mới
                      </div>
                      
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
                        onClick={() => navigate(`/products/details/${p.id}${window.location.search}`)}
                      >
                        {p.ten_san_pham}
                      </h2>
                      
                      {/* Rating Stars (Mocked to match design) */}
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
                            onClick={() => handleAddToCart(p)}
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
