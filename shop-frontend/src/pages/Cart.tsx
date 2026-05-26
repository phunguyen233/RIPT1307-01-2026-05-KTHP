import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import PaymentModal from "../components/paymentModal";
import { API_KEY } from "../api/shopApiClient";
import customersAPI from "../api/customersAPI";
import ordersAPI from "../api/ordersAPI";

export default function Cart() {
  const [cart, setCart] = useState<Array<any>>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    setCart(raw ? JSON.parse(raw) : []);
  }, []);

  const save = (next: any) => {
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
  };

  const inc = (id: any) => {
    const next = cart.map((c) => {
      if (c.id !== id) return c;
      const desired = (c.quantity || 1) + 1;
      return { ...c, quantity: desired };
    });
    save(next);
  };

  const dec = (id: any) => {
    let next = cart.map((c) => (c.id === id ? { ...c, quantity: (c.quantity || 1) - 1 } : c));
    next = next.filter((c) => c.quantity > 0);
    save(next);
  };

  const remove = (id: any) => {
    const next = cart.filter((c) => c.id !== id);
    save(next);
  };

  const total = cart.reduce((s, c) => s + (c.quantity || 1) * Number(c.gia_ban || c.price || 0), 0);

  const handleCheckout = async () => {
    // Validate checkout fields before creating order
    const fieldErrs: { name?: string; phone?: string; address?: string } = {};
    if (!checkoutName || !checkoutName.trim()) fieldErrs.name = 'Vui lòng nhập tên người nhận';
    const phoneRe = /^[0-9\+\-\s]{7,20}$/;
    if (!checkoutPhone || !phoneRe.test(checkoutPhone)) fieldErrs.phone = 'Số điện thoại không hợp lệ';
    if (!checkoutAddress || !checkoutAddress.trim()) fieldErrs.address = 'Vui lòng nhập địa chỉ nhận hàng';
    if (Object.keys(fieldErrs).length) {
      setCheckoutFieldErrors(fieldErrs);
      const missing = Object.values(fieldErrs).join('\n');
      alert('Vui lòng hoàn thành thông tin nhận hàng:\n' + missing);
      return;
    }
    setCheckoutFieldErrors({});

    // Shop-frontend requires API key to be configured
    if (!API_KEY) {
      alert('Chưa cấu hình API Key. Vui lòng kiểm tra file .env');
      return;
    }

    try {
      let ma_khach_hang: number;
      
      // Create or find customer via API key
      try {
        // Try to find existing customer by phone
        const customers = await customersAPI.getAll();
        const existingCustomer = customers.find((c: any) => c.phone === checkoutPhone || c.so_dien_thoai === checkoutPhone);
        
        if (existingCustomer) {
          ma_khach_hang = existingCustomer.id || existingCustomer.ma_khach_hang;
        } else {
          // Create new customer
          const newCustomer = await customersAPI.create({
            name: checkoutName,
            phone: checkoutPhone,
            address: checkoutAddress
          });
          ma_khach_hang = newCustomer.id || newCustomer.ma_khach_hang;
        }
      } catch (customerErr) {
        console.error("Customer error:", customerErr);
        // Try to create customer anyway
        const newCustomer = await customersAPI.create({
          name: checkoutName,
          phone: checkoutPhone,
          address: checkoutAddress
        });
        ma_khach_hang = newCustomer.id || newCustomer.ma_khach_hang;
      }

      // Create order via API key
      const orderItems = cart.map((c) => ({
        product_id: c.id,
        quantity: c.quantity || 1,
        price: c.gia_ban || c.price || 0
      }));

      const orderRes = await ordersAPI.create({
        customer_id: ma_khach_hang,
        shipping_address: checkoutAddress,
        total_price: total,
        items: orderItems
      });

      const ma_don_hang = orderRes.id || orderRes.ma_don_hang;
      setMaDonHang(ma_don_hang);
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.error || 'Lỗi khi đặt hàng');
    }
  };

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutFieldErrors, setCheckoutFieldErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [maDonHang, setMaDonHang] = useState<number | null>(null);

  return (
    <div className="p-6">
      <Breadcrumbs />
      <h1 className="text-2xl font-semibold mb-4">Giỏ hàng</h1>
      {cart.length === 0 ? (
        <p>Giỏ hàng của bạn đang trống.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((c) => (
            <div key={c.id} className="flex items-center gap-4 border p-3 rounded">
              <img src={require('../api/imageHelper').resolveImageUrl(c.hinh_anh)} alt={c.ten_san_pham} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              <div className="flex-1">
                <div className="font-semibold">{c.ten_san_pham}</div>
                <div className="text-green-600 font-bold">{Number(c.gia_ban || c.price || 0).toLocaleString()}đ</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => dec(c.id)} className="px-3 py-1 bg-gray-200 rounded">-</button>
                <div className="px-3">{c.quantity || 1}</div>
                <button onClick={() => inc(c.id)} className="px-3 py-1 bg-gray-200 rounded">+</button>
              </div>
              <button onClick={() => remove(c.id)} className="ml-4 text-red-600">✕</button>
            </div>
          ))}

          <div className="text-right font-semibold">Tổng: {Number(total).toLocaleString()}đ</div>

          <div className="text-right">
            <button onClick={() => setShowCheckout(true)} className="bg-blue-600 text-white px-6 py-2 rounded">Đặt hàng</button>
          </div>
        </div>
      )}
      {/* Checkout modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-semibold mb-4">Thông tin nhận hàng</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Tên người nhận</label>
                <input className={`w-full border rounded px-3 py-2 ${checkoutFieldErrors.name ? 'border-red-500' : ''}`} value={checkoutName} onChange={(e) => setCheckoutName(e.target.value)} />
                {checkoutFieldErrors.name && <p className="text-red-600 text-xs mt-1">{checkoutFieldErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1">Số điện thoại</label>
                <input className={`w-full border rounded px-3 py-2 ${checkoutFieldErrors.phone ? 'border-red-500' : ''}`} value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value)} />
                {checkoutFieldErrors.phone && <p className="text-red-600 text-xs mt-1">{checkoutFieldErrors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm mb-1">Địa chỉ nhận</label>
                <input className={`w-full border rounded px-3 py-2 ${checkoutFieldErrors.address ? 'border-red-500' : ''}`} value={checkoutAddress} onChange={(e) => setCheckoutAddress(e.target.value)} />
                {checkoutFieldErrors.address && <p className="text-red-600 text-xs mt-1">{checkoutFieldErrors.address}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button onClick={() => setShowCheckout(false)} className="px-4 py-2 bg-gray-300 rounded">Hủy</button>
                <button onClick={handleCheckout} className="px-4 py-2 bg-blue-600 text-white rounded">Xác nhận đặt hàng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal shown after order creation */}
      {showPaymentModal && maDonHang && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <PaymentModal
            maDonHang={maDonHang}
            amount={total}
            info={`Thanh toán đơn ${maDonHang}`}
            onClose={() => setShowPaymentModal(false)}
            onCancelled={(id) => {
              // after cancellation, clear cart and close modals
              save([]);
              setShowPaymentModal(false);
              setShowCheckout(false);
              setMaDonHang(null);
              navigate('/');
            }}
            onPaid={(id) => {
              // when user marks as paid, clear cart and close modals
              save([]);
              setShowPaymentModal(false);
              setShowCheckout(false);
              setMaDonHang(null);
              navigate('/');
            }}
          />
        </div>
      )}
    </div>
  );
}
