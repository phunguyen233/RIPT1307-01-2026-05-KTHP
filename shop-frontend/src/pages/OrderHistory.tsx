import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import ordersAPI from "../api/ordersAPI";

export default function OrderHistory() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isAuth, setIsAuth] = useState<boolean>(true);
  const navigate = useNavigate();
  // infoModal removed as it was unused

  const statusLabel = (s: string | undefined) => {
    if (!s) return 'Chờ xử lý';
    if (s === 'pending' || s === 'cho_xu_ly') return 'Chờ xử lý';
    if (s === 'hoan_tat' || s === 'da_thanh_toan' || s === 'completed') return 'Hoàn thành';
    if (s === 'huy' || s === 'cancelled' || s === 'canceled') return 'Đã hủy';
    return 'Hoàn thành';
  };

  const badgeClassFor = (s: string | undefined) => {
    if (!s || s === 'pending' || s === 'cho_xu_ly') return 'bg-yellow-100 text-yellow-800';
    if (s === 'hoan_tat' || s === 'da_thanh_toan' || s === 'completed') return 'bg-green-100 text-green-800';
    if (s === 'huy' || s === 'cancelled' || s === 'canceled') return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const formatDate = (value: any) => {
    if (!value) return '-';
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString('vi-VN');
  };

  // getOrderStatusSteps removed (unused)

  const normalizeOrder = (order: any) => ({
    ...order,
    orderId: order.id || order.ma_don_hang || order.order_code,
    orderCode: order.order_code || order.ma_don_hang || order.id,
    orderDate: order.thoi_gian_mua || order.created_at || order.createdAt || order.order_date,
    customerName: order.ho_ten || order.ten_khach_hang || order.customer_name || order.name,
    recipientName: order.ten_nguoi_nhan || order.ten_khach_hang || order.ho_ten || order.customer_name || order.name,
    customerPhone: order.so_dien_thoai_nhan || order.so_dien_thoai || order.customer_phone || order.phone,
    shippingAddress: order.dia_chi_nhan || order.dia_chi_giao_hang || order.dia_chi || order.shipping_address,
    deliveryTime: order.delivery_time || order.thoi_gian_nhan || null,
    items: order.order_items || order.items || [],
  });

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuth(false);
      setOrders([]);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await ordersAPI.getAll();
      setOrders((res || []).map(normalizeOrder));
    } catch (err) {
      console.error('OrderHistory error', err);
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        setIsAuth(false);
        setOrders([]);
        setErrorMsg('Vui lòng đăng nhập để xem đơn hàng của bạn.');
      } else {
        const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Lỗi khi lấy đơn hàng';
        setErrorMsg(msg.toString());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewDetail = async (orderId: number | string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuth(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await ordersAPI.getById(Number(orderId));
      setSelectedOrder(normalizeOrder(res));
    } catch (err) {
      console.error('Order detail error', err);
      const status = (err as any)?.response?.status;
      if (status === 401 || status === 403) {
        setIsAuth(false);
        setErrorMsg('Vui lòng đăng nhập để xem chi tiết đơn hàng.');
      } else {
        const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Lỗi khi lấy chi tiết đơn hàng';
        setErrorMsg(msg.toString());
      }
    } finally {
      setLoading(false);
    }
  };

  const closeDetail = () => setSelectedOrder(null);

return (
  <div className="min-h-screen bg-[#f5f5f5] py-6 px-4">
    <div className="max-w-7xl mx-auto">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-[#1f2937]">
            Đơn hàng của bạn
          </h1>

          <p className="text-gray-500 mt-2">
            Theo dõi trạng thái và lịch sử các đơn hàng của bạn
          </p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={fetchOrders}
            className="border border-gray-300 bg-white hover:border-[#22aa44] px-5 py-3 rounded-lg font-medium"
          >
            Làm mới
          </button>

          <button
            onClick={() => navigate("/products")}
            className="bg-[#22aa44] hover:bg-[#1e973d] text-white px-6 py-3 rounded-lg font-semibold"
          >
            + Đặt món mới
          </button>
        </div>
      </div>

      {!isAuth && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-5">
          Vui lòng đăng nhập để xem lịch sử đơn hàng
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#22aa44] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : errorMsg ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          {errorMsg}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border">
          <h3 className="text-xl font-semibold text-gray-700">
            Chưa có đơn hàng
          </h3>

          <p className="text-gray-500 mt-2">
            Bạn chưa đặt đơn hàng nào.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o, index) => (
            <div
              key={o.ma_don_hang || index}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center px-5 py-3 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center text-3xl">
                    📋
                  </div>

                  <div>
                    <h2 className="font-semibold text-sm text-gray-900">
                      #{o.orderCode}
                    </h2>

                    <p className="text-gray-400 text-[11px] mt-1">
                      Đặt lúc: {formatDate(o.orderDate)}
                    </p>

                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badgeClassFor(
                        o.status
                      )}`}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-gray-400 text-[11px]">
                    Tổng tiền
                  </p>

                  <h3 className="text-lg font-bold text-[#22aa44] mt-1">
                    {o.total_price?.toLocaleString?.()}đ
                  </h3>
                </div>
              </div>

              {/* BODY */}
              <div className="grid lg:grid-cols-[300px_1fr]">
                {/* SHIPPING */}
                <div className="p-3 border-r">
                  <h3 className="font-bold text-lg mb-4">
                    Thông tin giao hàng
                  </h3>

                  <div className="space-y-1 text-sm text-gray-700">
                    <p className ="flex items-center gap-1">
                      <span className="text-black">👤</span>
                      {o.customerName || "Chưa có tên"}
                    </p>

                    <p
                      className="flex items-center gap-2"
                    >
                      <span className="text-black">☎</span>
                      {o.customerPhone || "Chưa có SĐT"}
                    </p>

                    <p
                      className="flex items-center gap-2"
                    >
                      <span className="text-black">⌂</span>
                      {o.shippingAddress || "Chưa có địa chỉ"}
                    </p>
                  </div>
                </div>

                {/* PRODUCTS */}
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-4">
                    Sản phẩm
                  </h3>

                  <div className="flex flex-wrap gap-8">
                    {(o.items || []).slice(0, 4).map(
                      (it: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3"
                        >
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                            <img
                              src={
                                it.product_image ||
                                it.hinh_anh ||
                                "https://via.placeholder.com/80"
                              }
                              alt={it.product_name || it.ten_san_pham}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div>
                            <div className="font-medium text-gray-800">
                              {it.product_name || it.ten_san_pham}
                            </div>

                            <div className="text-sm text-gray-500">
                              x {it.quantity || it.so_luong}
                            </div>

                            <div className="text-[#22aa44] font-semibold">
                              {(
                                (it.quantity || it.so_luong || 0) *
                                (it.price || it.don_gia || 0)
                              ).toLocaleString()}
                              đ
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="border-t px-5 py-3 flex justify-between items-center">
                <button
                  onClick={() =>
                    handleViewDetail(o.id)
                  }
                  className="border border-[#22aa44] text-[#22aa44] hover:bg-[#22aa44] hover:text-white px-3 py-1.5 rounded-md text-sm transition"
                >
                  📄 Xem chi tiết
                </button>

                <button className="text-[#22aa44] text-sm font-medium hover:underline">
                  Đặt lại ↻
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          Chi tiết đơn hàng #{selectedOrder.orderCode}
        </h2>

        <button
          onClick={closeDetail}
          className="text-red-500 font-bold"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        <p>
          <strong>Khách hàng:</strong>{" "}
          {selectedOrder.customerName}
        </p>

        <p>
          <strong>Số điện thoại:</strong>{" "}
          {selectedOrder.customerPhone}
        </p>

        <p>
          <strong>Địa chỉ:</strong>{" "}
          {selectedOrder.shippingAddress}
        </p>

        <p>
          <strong>Trạng thái:</strong>{" "}
          {statusLabel(selectedOrder.status)}
        </p>

        <p>
          <strong>Tổng tiền:</strong>{" "}
          {selectedOrder.total_price?.toLocaleString()}đ
        </p>
      </div>

      <hr className="my-4" />

      <h3 className="font-bold mb-3">
        Danh sách sản phẩm
      </h3>

      {(selectedOrder.items || []).map(
        (item: any, index: number) => (
          <div
            key={index}
            className="flex justify-between border-b py-2"
          >
            <span>
              {item.product_name || item.ten_san_pham}
            </span>

            <span>x {item.quantity || item.so_luong}</span>

            <span>
              {(
                (item.price || item.don_gia || 0) *
                (item.quantity || item.so_luong || 0)
              ).toLocaleString()}
              đ
            </span>
          </div>
        )
      )}
    </div>
  </div>
)}
    </div>
  </div>
);
}