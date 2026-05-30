import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import ordersAPI from "../api/ordersAPI";
import { API_KEY } from "../api/shopApiClient";

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

  const getOrderStatusSteps = (status: string | undefined) => {
    const isCanceled = status === 'huy' || status === 'cancelled' || status === 'canceled';
    const isCompleted = status === 'hoan_tat' || status === 'da_thanh_toan' || status === 'completed';

    if (isCanceled) {
      return [
        { key: 'pending', label: 'Chờ xử lý' },
        { key: 'cancelled', label: 'Đã hủy' },
      ];
    }

    return [
      { key: 'pending', label: 'Chờ xử lý' },
      { key: 'completed', label: 'Hoàn thành' },
    ];
  };

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

  const fetchOrders = async () => {
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
      const msg = (err as any)?.response?.data?.message || (err as any)?.message || 'Lỗi khi lấy chi tiết đơn hàng';
      setErrorMsg(msg.toString());
    } finally {
      setLoading(false);
    }
  };

  const closeDetail = () => setSelectedOrder(null);

  return (
    <div className="p-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-semibold mb-4">Đơn hàng của bạn</h1>
      {!isAuth && (
        <div className="p-6 bg-yellow-50 border-l-4 border-yellow-300 text-yellow-800 rounded mb-4">Đăng nhập để thấy đơn hàng của bạn</div>
      )}
      {/* Info modal shown when navigated from payment modal */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
            <div className="mb-4 text-gray-800">{infoModal}</div>
            <div className="flex justify-center">
              <button
                onClick={() => setInfoModal(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-end mb-4">
        <button onClick={fetchOrders} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">Làm mới</button>
      </div>
      {loading ? (
        <p>Đang tải...</p>
      ) : errorMsg ? (
        <p className="text-red-600">{errorMsg}</p>
      ) : orders.length === 0 ? (
        <p>{isAuth ? 'Bạn chưa đặt đơn hàng nào.' : 'Chưa có dữ liệu.'}</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.orderId} className="border p-4 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">Mã đơn: {o.orderCode}</div>
                  <div className="text-sm text-gray-600">Ngày: {formatDate(o.orderDate)}</div>
                  <div className="text-sm text-gray-600">Nhận hàng: {o.deliveryTime ? formatDate(o.deliveryTime) : 'Chưa xác định'}</div>
                  <div className="text-sm">Người nhận: {o.recipientName || '-'}</div>
                  <div className="text-sm">SĐT nhận: {o.customerPhone || '-'}</div>
                  <div className="text-sm">Địa chỉ: {o.shippingAddress || '-'}</div>
                  <div className="text-sm">Số sản phẩm: {(o.items || []).length}</div>
                  <div className="text-sm">Tổng tiền: {(o.tong_tien || o.total_price || o.totalPrice)?.toLocaleString ? (o.tong_tien || o.total_price || o.totalPrice).toLocaleString() + 'đ' : (o.tong_tien || o.total_price || o.totalPrice)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeClassFor(o.trang_thai || o.status)}`}>{statusLabel(o.trang_thai || o.status)}</span>
                  <button onClick={() => handleViewDetail(o.orderId)} className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded">Chi tiết</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-11/12 md:w-2/3 lg:w-1/2 p-6 rounded shadow-lg max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chi tiết đơn {selectedOrder.orderCode || selectedOrder.orderId}</h2>
              <button onClick={closeDetail} className="text-gray-600 hover:text-gray-900">Đóng</button>
            </div>

            <div className="text-sm text-gray-700 mb-3">
              <div><strong>Ngày:</strong> {formatDate(selectedOrder.orderDate)}</div>
              <div><strong>Thời gian nhận hàng:</strong> {selectedOrder.deliveryTime ? formatDate(selectedOrder.deliveryTime) : 'Chưa xác định'}</div>
              <div><strong>Khách:</strong> {selectedOrder.customerName || '-'}</div>
              <div><strong>Người nhận:</strong> {selectedOrder.recipientName || '-'}</div>
              <div><strong>SĐT nhận:</strong> {selectedOrder.customerPhone || '-'}</div>
              <div><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress || '-'}</div>
              <div className="mt-2"><strong>Trạng thái:</strong> <span className={`px-2 py-1 rounded ${badgeClassFor(selectedOrder.trang_thai || selectedOrder.status)}`}>{statusLabel(selectedOrder.trang_thai || selectedOrder.status)}</span></div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Tiến trình đơn hàng</h3>
              <div className="space-y-3">
                {getOrderStatusSteps(selectedOrder.trang_thai || selectedOrder.status).map((step, idx) => {
                  const isActive = step.key === (selectedOrder.trang_thai || selectedOrder.status);
                  const isCompleted = selectedOrder.trang_thai === 'completed' || selectedOrder.status === 'completed' || step.key === 'pending';
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className={`font-semibold ${isActive ? 'text-green-700' : 'text-gray-700'}`}>{step.label}</div>
                        <div className="text-xs text-gray-500">
                          {step.key === 'pending' ? 'Đơn hàng đang chờ xác nhận và xử lý' : step.key === 'completed' ? 'Đơn hàng đã hoàn thành' : 'Đơn hàng đã bị hủy'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-2">Sản phẩm</th>
                    <th className="py-2">Số lượng</th>
                    <th className="py-2">Đơn giá</th>
                    <th className="py-2">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedOrder.items || []).map((it: any, idx: number) => {
                    const quantity = it.so_luong || it.quantity || it.qty || 0;
                    const price = it.don_gia || it.price || 0;
                    const productName = it.ten_san_pham || it.product_name || it.name || `Sản phẩm ${idx + 1}`;
                    return (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{productName}</td>
                        <td className="py-2">{quantity}</td>
                        <td className="py-2">{price?.toLocaleString?.() ?? price}đ</td>
                        <td className="py-2">{((quantity || 0) * (price || 0)).toLocaleString()}đ</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 text-right font-semibold">Tổng: {(selectedOrder.tong_tien || selectedOrder.total_price || selectedOrder.totalPrice)?.toLocaleString ? (selectedOrder.tong_tien || selectedOrder.total_price || selectedOrder.totalPrice).toLocaleString() + 'đ' : (selectedOrder.tong_tien || selectedOrder.total_price || selectedOrder.totalPrice)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
