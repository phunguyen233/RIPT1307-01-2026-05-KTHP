import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import ordersAPI from "../api/ordersAPI";
import customersAPI from "../api/customersAPI";
import { API_KEY } from "../api/shopApiClient";

const API = "https://bepmam-backend.onrender.com/api";

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isAuth, setIsAuth] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [infoModal, setInfoModal] = useState<string | null>((location.state as any)?.infoModal || null);

  const statusLabel = (s: string | undefined) => {
    if (!s) return 'Chờ xử lý';
    if (s === 'cho_xu_ly') return 'Chờ xử lý';
    if (s === 'da_thanh_toan') return 'Đã thanh toán';
    if (s === 'dang_giao') return 'Đang giao';
    if (s === 'hoan_tat') return 'Hoàn thành';
    if (s === 'huy') return 'Đã hủy';
    return s;
  };

  const badgeClassFor = (s: string | undefined) => {
    if (!s || s === 'cho_xu_ly') return 'bg-gray-100 text-gray-800';
    if (s === 'da_thanh_toan') return 'bg-green-100 text-green-800';
    if (s === 'dang_giao') return 'bg-yellow-100 text-yellow-800';
    if (s === 'hoan_tat') return 'bg-emerald-100 text-emerald-800';
    if (s === 'huy') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const fetchOrders = async () => {
    if (!API_KEY) {
      setIsAuth(false);
      setOrders([]);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await ordersAPI.getAll();
      setOrders(res || []);
    } catch (err) {
      console.error('OrderHistory error', err);
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Lỗi khi lấy đơn hàng';
      setErrorMsg(msg.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleViewDetail = async (orderId: number | string) => {
    if (!API_KEY) {
      setIsAuth(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await ordersAPI.getById(Number(orderId));
      setSelectedOrder(res);
    } catch (err) {
      console.error('Order detail error', err);
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Lỗi khi lấy chi tiết đơn hàng';
      setErrorMsg(msg.toString());
    } finally {
      setLoading(false);
    }
  };

  const closeDetail = () => setSelectedOrder(null);

return (
  <div className="min-h-screen bg-[#f5f5f5] py-10 px-4">
    <div className="max-w-5xl mx-auto">
      <Breadcrumbs />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-5xl font-bold text-[#1f2937]">
            Đơn hàng của bạn
          </h1>

          <p className="text-gray-500 mt-3 text-lg">
            Theo dõi trạng thái và lịch sử các đơn hàng của bạn
          </p>
        </div>

        <div className="mt-5 md:mt-0 flex items-center gap-3">
  <button
    onClick={fetchOrders}
    className="bg-white border border-gray-300 hover:border-[#22aa44] text-gray-700 hover:text-[#22aa44] px-5 py-3 rounded-lg font-semibold transition"
  >
    Làm mới
  </button>

  <button
    onClick={() => navigate("/products")}
    className="bg-[#22aa44] hover:bg-[#1d963d] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
  >
    <span className="text-xl leading-none">+</span>
    <span>Đặt món mới</span>
  </button>
</div>
      </div>

      {/* LOGIN */}
      {!isAuth && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 p-4 rounded-xl mb-6">
          Vui lòng đăng nhập để xem đơn hàng
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-[#22aa44] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-100 text-red-600 p-4 rounded-xl">
          {errorMsg}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Chưa có đơn hàng
          </h2>

          <p className="text-gray-500">
            Bạn chưa đặt đơn hàng nào
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((o, index) => (
            <div
              key={o.id || o.ma_don_hang || index}
              className="bg-white rounded-lg overflow-hidden border border-gray-200"
            >
              {/* TOP */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 border-b">
                {/* LEFT */}
                <div className="flex items-start gap-5">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl
                    ${
                      o.trang_thai === "hoan_tat"
                        ? "bg-green-100 text-green-600"
                        : o.trang_thai === "huy"
                        ? "bg-red-100 text-red-500"
                        : "bg-orange-100 text-orange-500"
                    }`}
                  >
                    📋
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-[#1f2937]">
                      #DH{o.id || o.ma_don_hang}
                    </h2>

                    <p className="text-gray-500 mt-2 text-lg">
                      Đặt lúc: {o.thoi_gian_mua}
                    </p>

                    <div className="mt-3">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-semibold ${badgeClassFor(
                          o.trang_thai
                        )}`}
                      >
                        {statusLabel(o.trang_thai)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="mt-6 lg:mt-0 text-right">
                  <p className="text-gray-500 text-xl">
                    Tổng tiền
                  </p>

                  <h2 className="text-5xl font-bold text-[#22aa44] mt-2">
                    {o.tong_tien?.toLocaleString?.()}đ
                  </h2>
                </div>
              </div>

              {/* BODY */}
              <div className="grid lg:grid-cols-3 min-h-[180px]">
                {/* SHIPPING */}
                <div className="p-4 border-r">
                  <h3 className="text-xl font-bold text-[#1f2937] mb-5">
                    Thông tin giao hàng
                  </h3>

                  <div className="space-y-4 text-gray-700">
                    <p className="flex items-start gap-3 text-lg">
                      <span>👤</span>

                      <span>
                        {o.ten_nguoi_nhan ||
                          o.ten_khach_hang ||
                          o.ho_ten}
                      </span>
                    </p>

                    <p className="flex items-start gap-3 text-lg">
                      <span>📞</span>

                      <span>
                        {o.so_dien_thoai_nhan ||
                          o.so_dien_thoai}
                      </span>
                    </p>

                    <p className="flex items-start gap-3 text-lg">
                      <span>📍</span>

                      <span>
                        {o.dia_chi_nhan ||
                          o.dia_chi_giao_hang ||
                          o.dia_chi}
                      </span>
                    </p>
                  </div>
                </div>

                {/* PRODUCTS */}
                <div className="lg:col-span-2 p-4">
                  <h3 className="text-xl font-bold text-[#1f2937] mb-5">
                    Sản phẩm
                  </h3>

                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {(o.items || []).slice(0, 3).map(
                      (it: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4"
                        >
                          <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            <img
                              src={
                                it.hinh_anh ||
                                "https://via.placeholder.com/100"
                              }
                              alt={it.ten_san_pham}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div>
                            <h4 className="font-bold text-xl text-[#1f2937]">
                              {it.ten_san_pham}
                            </h4>

                            <p className="text-gray-500 mt-1">
                              x {it.so_luong}
                            </p>

                            <p className="text-2xl font-semibold mt-2">
                              {(
                                (it.so_luong || 0) *
                                (it.don_gia || 0)
                              ).toLocaleString()}
                              đ
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="border-t px-4 py-3 flex items-center justify-between">
                <button
                  onClick={() =>
                    handleViewDetail(
                      o.id || o.ma_don_hang
                    )
                  }
                  className="border border-[#22aa44] text-[#22aa44] hover:bg-[#22aa44] hover:text-white px-6 py-3 rounded-xl font-semibold transition"
                >
                  📄 Xem chi tiết
                </button>

                <button className="text-[#22aa44] font-semibold text-lg hover:underline">
                  Đặt lại ↻
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-auto">
            {/* HEADER */}
            <div className="border-b p-6 flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-bold text-[#1f2937]">
                  Đơn hàng #
                  {selectedOrder.id ||
                    selectedOrder.ma_don_hang}
                </h2>

                <p className="text-gray-500 mt-2 text-lg">
                  {selectedOrder.thoi_gian_mua}
                </p>
              </div>

              <button
                onClick={closeDetail}
                className="text-4xl text-gray-500 hover:text-red-500"
              >
                ×
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 space-y-5">
              {selectedOrder.items?.map(
                (it: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between border rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={
                            it.hinh_anh ||
                            "https://via.placeholder.com/100"
                          }
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div>
                        <h3 className="text-2xl font-bold text-[#1f2937]">
                          {it.ten_san_pham}
                        </h3>

                        <p className="text-gray-500 mt-2">
                          Số lượng: {it.so_luong}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-gray-500">
                        {it.don_gia?.toLocaleString?.()}đ
                      </p>

                      <h3 className="text-3xl font-bold text-[#22aa44] mt-2">
                        {(
                          (it.so_luong || 0) *
                          (it.don_gia || 0)
                        ).toLocaleString()}
                        đ
                      </h3>
                    </div>
                  </div>
                )
              )}

              {/* TOTAL */}
              <div className="border-t mt-8 pt-6 flex justify-between items-center">
                <h2 className="text-3xl font-bold text-[#1f2937]">
                  Tổng thanh toán
                </h2>

                <h2 className="text-5xl font-bold text-[#22aa44]">
                  {selectedOrder.tong_tien?.toLocaleString()}
                  đ
                </h2>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
}