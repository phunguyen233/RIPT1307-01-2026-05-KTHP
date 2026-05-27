import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
        alert('Sản phẩm hiện không có sẵn để đặt (đang ẩn).');
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
      alert(`${product.ten_san_pham} đã được thêm vào giỏ hàng`);
    } catch (err) {
      console.error("Lỗi khi thêm vào giỏ hàng:", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const search = query.trim().toLowerCase();
    const matchesSearch = !search || (p.ten_san_pham || "").toLowerCase().includes(search);
    const matchesCategory = selectedCategoryId === null || p.category_id === selectedCategoryId;
    return matchesSearch && matchesCategory;
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
            <h3 className="text-[15px] font-bold uppercase border-b-2 border-green-600 inline-block pb-2 mb-4 text-gray-800">
              LOẠI SẢN PHẨM
            </h3>
            <ul className="flex flex-col gap-4 text-[14px] text-gray-600 mt-2">
              <li>
                <button
                  className={`text-left w-full hover:text-green-600 transition-colors pb-4 border-b border-gray-100 ${selectedCategoryId === null ? 'font-bold text-green-600' : ''}`}
                  onClick={() => setSelectedCategoryId(null)}
                >
                  Tất cả
                </button>
              </li>
              {categories.map((c: any) => (
                <li key={c.id}>
                  <button
                    className={`text-left w-full hover:text-green-600 transition-colors pb-4 border-b border-gray-100 ${selectedCategoryId === c.id ? 'font-bold text-green-600' : ''}`}
                    onClick={() => setSelectedCategoryId(c.id)}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-[20px] font-bold uppercase text-gray-800">
                DANH SÁCH SẢN PHẨM
              </h3>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="p-3 border border-gray-200 shadow-sm text-sm w-full sm:w-64 rounded-full focus:outline-none focus:border-green-400"
                aria-label="Tìm sản phẩm"
              />
            </div>

            <div className="grid gap-6 justify-items-center grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-20 text-gray-500">
                  Không tìm thấy sản phẩm phù hợp.
                </div>
              ) : filteredProducts.map((p) => (
                <div key={p.id} className="p-2 w-full max-w-xs mx-auto">
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
                      className="w-full mb-3 overflow-hidden rounded-xl cursor-pointer"
                      style={{ position: "relative", width: "100%", paddingTop: "100%", }}
                      onClick={() => navigate(`/products/details/${p.id}${window.location.search}`)}
                    >
                      <img
                        src={resolveImageUrl(p.hinh_anh)}
                        alt={p.ten_san_pham}
                        onError={(e: any) => {
                          e.currentTarget.src = "/placeholder.png";
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
                      />
                    </div>

                    {/* Info under the image */}
                    <div className="text-center px-2">
                      <h2 
                        className="font-semibold text-[16px] mb-1 truncate text-gray-800 cursor-pointer hover:text-green-600 transition-colors"
                        onClick={() => navigate(`/products/details/${p.id}${window.location.search}`)}
                      >
                        {p.ten_san_pham}
                      </h2>
                      <p className="text-gray-900 font-bold mb-3">{Number(p.gia_ban).toLocaleString()} ₫</p>
                    </div>

                    {/* Buttons row */}
                    <div className="px-2 mt-auto flex gap-2 w-full justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                         style={{ opacity: hoveredId === p.id ? 1 : 0 }}>
                      {(!p.hien_thi) ? (
                        <button
                          type="button"
                          disabled
                          className="px-4 py-2 text-[13px] bg-gray-300 text-white rounded-xl cursor-not-allowed select-none"
                        >
                          Không khả dụng
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(p)}
                          onMouseDown={() => setPressedButton(`${p.id}-add`)}
                          onMouseUp={() => setPressedButton(null)}
                          onMouseLeave={() => setPressedButton(null)}
                          onTouchStart={() => setPressedButton(`${p.id}-add`)}
                          onTouchEnd={() => setPressedButton(null)}
                          className={`
                            px-4 py-2 text-[13px] font-medium text-white rounded-xl transition-all duration-150
                            ${pressedButton === `${p.id}-add`
                              ? "bg-green-700 scale-95"
                              : "bg-green-600 hover:bg-green-700 active:bg-green-800"}
                          `}
                        >
                          Thêm vào giỏ
                        </button>
                      )}
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
