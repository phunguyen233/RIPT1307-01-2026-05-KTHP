import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import PaymentModal from "../components/paymentModal";
import { API_KEY } from "../api/shopApiClient";
import customersAPI from "../api/customersAPI";
import ordersAPI from "../api/ordersAPI";
import { toast } from "react-toastify";

export default function Cart() {
  const [cart, setCart] = useState<Array<any>>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const stateFrom = (location.state as any) || {};
    if (stateFrom.autoCheckout) {
      setShowCheckout(true);
    }
  }, [location.state]);

  useEffect(() => {
    const raw = localStorage.getItem("cart");
    setCart(raw ? JSON.parse(raw) : []);
  }, []);

  const save = (next: any) => {
    setCart(next);
    localStorage.setItem("cart", JSON.stringify(next));
    try { window.dispatchEvent(new Event('cartChange')); } catch {}
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
      toast.error(
        <div>
          <div className="font-bold text-gray-800 text-base mb-1">Thông báo</div>
          <div className="text-gray-600 text-sm">Vui lòng điền đầy đủ thông tin nhận hàng</div>
        </div>,
        {
          className: '!border-l-4 !border-red-600 !rounded-none !rounded-r-md',
        }
      );
      return;
    }
    setCheckoutFieldErrors({});

    // Shop-frontend requires API key to be configured
    if (!API_KEY) {
      toast.error(
        <div>
          <div className="font-bold text-gray-800 text-base mb-1">Lỗi hệ thống</div>
          <div className="text-gray-600 text-sm">Chưa cấu hình API Key. Vui lòng kiểm tra file .env</div>
        </div>,
        {
          className: '!border-l-4 !border-red-600 !rounded-none !rounded-r-md',
        }
      );
      return;
    }

    try {
      let ma_khach_hang: number;
      const storedUser = localStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const currentUserId = currentUser?.id || null;

      // Create or find customer via API key
      try {
        const customers = await customersAPI.getAll();
        const existingCustomer = customers.find((c: any) =>
          (currentUserId && c.user_id === currentUserId) ||
          c.phone === checkoutPhone ||
          c.so_dien_thoai === checkoutPhone
        );

        if (existingCustomer) {
          ma_khach_hang = existingCustomer.id || existingCustomer.ma_khach_hang;
        } else {
          // Create new customer with linked user_id when available
          const customerPayload: any = {
            name: checkoutName,
            phone: checkoutPhone,
            address: checkoutAddress,
          };
          if (currentUserId) {
            customerPayload.user_id = currentUserId;
          }
          const newCustomer = await customersAPI.create(customerPayload);
          ma_khach_hang = newCustomer.id || newCustomer.ma_khach_hang;
        }
      } catch (customerErr) {
        console.error("Customer error:", customerErr);
        const customerPayload: any = {
          name: checkoutName,
          phone: checkoutPhone,
          address: checkoutAddress,
        };
        if (currentUserId) {
          customerPayload.user_id = currentUserId;
        }
        const newCustomer = await customersAPI.create(customerPayload);
        ma_khach_hang = newCustomer.id || newCustomer.ma_khach_hang;
      }

      // Create order via API key
      const orderItems = cart.map((c) => ({
        product_id: c.id,
        quantity: c.quantity || 1,
        price: c.gia_ban || c.price || 0
      }));

      const deliveryTimeIso = checkoutDeliveryTime ? new Date(checkoutDeliveryTime).toISOString() : null;
      const orderRes = await ordersAPI.create({
        customer_id: ma_khach_hang,
        shipping_address: checkoutAddress,
        total_price: total,
        items: orderItems,
        delivery_time: deliveryTimeIso,
      });

      const ma_don_hang = orderRes.id || orderRes.ma_don_hang;
      setMaDonHang(ma_don_hang);
      setShowPaymentModal(true);
    } catch (err: any) {
      console.error(err);
      toast.error(
        <div>
          <div className="font-bold text-gray-800 text-base mb-1">Lỗi khi đặt hàng</div>
          <div className="text-gray-600 text-sm">{err?.response?.data?.error || 'Không thể tạo đơn hàng, vui lòng thử lại sau.'}</div>
        </div>,
        {
          className: '!border-l-4 !border-red-600 !rounded-none !rounded-r-md',
        }
      );
    }
  };

  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutDeliveryTime, setCheckoutDeliveryTime] = useState("");
  const [checkoutFieldErrors, setCheckoutFieldErrors] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [maDonHang, setMaDonHang] = useState<number | null>(null);

  return (
    <div className="p-4 md:p-8 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Breadcrumbs appendItems={showCheckout ? [{ label: 'Thanh toán' }] : undefined} />
        
        <div className="mt-6">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              Giỏ hàng của bạn đang trống.
            </div>
          ) : showCheckout ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mt-8">
              {/* Left Column: Billing Details */}
              <div className="md:col-span-7 text-left">
                <h2 className="text-lg font-bold uppercase mb-6 tracking-wider text-left">Chi tiết hoá đơn</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
                    <input 
                      placeholder="Nhập họ và tên"
                      className={`w-full border p-3 text-sm focus:outline-none focus:border-black ${checkoutFieldErrors.name ? 'border-red-500' : 'border-gray-200'}`} 
                      value={checkoutName} 
                      onChange={(e) => setCheckoutName(e.target.value)} 
                    />
                    {checkoutFieldErrors.name && <p className="text-red-600 text-xs mt-1">{checkoutFieldErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Số điện thoại <span className="text-red-500">*</span></label>
                    <input 
                      placeholder="Nhập số điện thoại"
                      className={`w-full border p-3 text-sm focus:outline-none focus:border-black ${checkoutFieldErrors.phone ? 'border-red-500' : 'border-gray-200'}`} 
                      value={checkoutPhone} 
                      onChange={(e) => setCheckoutPhone(e.target.value)} 
                    />
                    {checkoutFieldErrors.phone && <p className="text-red-600 text-xs mt-1">{checkoutFieldErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Địa chỉ <span className="text-red-500">*</span></label>
                    <input 
                      placeholder="Nhập địa chỉ"
                      className={`w-full border p-3 text-sm focus:outline-none focus:border-black ${checkoutFieldErrors.address ? 'border-red-500' : 'border-gray-200'}`} 
                      value={checkoutAddress} 
                      onChange={(e) => setCheckoutAddress(e.target.value)} 
                    />
                    {checkoutFieldErrors.address && <p className="text-red-600 text-xs mt-1">{checkoutFieldErrors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-2 text-gray-700">Thời gian nhận hàng</label>
                    <input 
                      type="datetime-local" 
                      className="w-full border p-3 text-sm focus:outline-none focus:border-black border-gray-200" 
                      value={checkoutDeliveryTime} 
                      onChange={(e) => setCheckoutDeliveryTime(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="md:col-span-5">
                <div className="bg-gray-100 p-6 md:p-8 rounded-2xl text-left">
                  <h2 className="text-lg font-bold uppercase mb-6 tracking-wider text-left">Đơn hàng của bạn</h2>
                  
                  <div className="flex justify-between border-b border-gray-200 pb-3 font-semibold text-sm">
                    <span>Sản phẩm</span>
                    <span>Thành tiền</span>
                  </div>

                  <div className="py-4 space-y-4 border-b border-gray-200 text-sm">
                    {cart.map((c, index) => (
                      <div key={c.id} className="flex justify-between">
                        <span className="text-gray-600">{index + 1}. {c.ten_san_pham} {c.quantity > 1 ? `(x${c.quantity})` : ''}</span>
                        <span className="font-semibold text-black">{((c.quantity || 1) * Number(c.gia_ban || c.price || 0)).toLocaleString()} ₫</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between py-4 border-b border-gray-200 items-center">
                    <span className="font-bold text-[14px]">Tổng tiền</span>
                    <span className="font-bold text-green-600 text-lg">{Number(total).toLocaleString()} ₫</span>
                  </div>

                  <div className="flex justify-center mt-6">
                    <button 
                      onClick={handleCheckout} 
                      className="w-48 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 text-sm uppercase transition-colors rounded-xl"
                    >
                      Đặt hàng
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowCheckout(false)} 
                    className="w-full text-center text-sm text-gray-500 hover:text-green-600 mt-4 underline"
                  >
                    Quay lại giỏ hàng
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Desktop Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 border-b border-gray-200 pb-3 mb-3 text-[14px] font-bold text-gray-800 uppercase">
                <div className="col-span-5">Sản phẩm</div>
                <div className="col-span-2 text-center">Giá</div>
                <div className="col-span-2 text-center">Số lượng</div>
                <div className="col-span-2 text-center">Tổng</div>
                <div className="col-span-1"></div>
              </div>

              {/* Cart Items */}
              <div className="space-y-4 md:space-y-0">
                {cart.map((c) => (
                  <div key={c.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center border-b border-gray-100 pb-4 md:py-4">
                    
                    {/* Product Info */}
                    <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                      <div className="w-16 h-16 shrink-0">
                        <img 
                          src={require('../api/imageHelper').resolveImageUrl(c.hinh_anh || c.image_url)} 
                          alt={c.ten_san_pham} 
                          className="w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <div className="font-semibold text-gray-800 text-[14px]">{c.ten_san_pham}</div>
                    </div>

                    {/* Price */}
                    <div className="col-span-1 md:col-span-2 flex md:justify-center items-center">
                      <span className="md:hidden text-gray-500 mr-2 text-sm">Giá:</span>
                      <span className="text-green-600 font-bold text-[14px]">
                        {Number(c.gia_ban || c.price || 0).toLocaleString()} ₫
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1 md:col-span-2 flex md:justify-center items-center">
                      <span className="md:hidden text-gray-500 mr-2 text-sm">Số lượng:</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => dec(c.id)} className="text-gray-500 hover:text-green-600 p-1 text-lg leading-none">-</button>
                        <span className="text-[14px] font-medium w-4 text-center">{c.quantity || 1}</span>
                        <button onClick={() => inc(c.id)} className="text-gray-500 hover:text-green-600 p-1 text-lg leading-none">+</button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="col-span-1 md:col-span-2 flex md:justify-center items-center">
                      <span className="md:hidden text-gray-500 mr-2 text-sm">Tổng:</span>
                      <span className="text-green-600 font-bold text-[14px]">
                        {((c.quantity || 1) * Number(c.gia_ban || c.price || 0)).toLocaleString()} ₫
                      </span>
                    </div>

                    {/* Remove Action */}
                    <div className="col-span-1 md:col-span-1 flex md:justify-center items-center">
                      <button 
                        onClick={() => remove(c.id)} 
                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                        title="Xóa"
                      >
                        <span className="text-sm">✕</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3">
                <button 
                  onClick={() => navigate('/products')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-[12px] font-bold uppercase px-5 py-2.5 rounded-md transition-colors"
                >
                  ← Tiếp tục mua hàng
                </button>
                <button 
                  onClick={() => {
                    const next = [...cart];
                    save(next);
                    toast.success(
                      <div>
                        <div className="font-bold text-gray-800 text-base mb-1">Thành công</div>
                        <div className="text-gray-600 text-sm">Giỏ hàng đã được cập nhật!</div>
                      </div>,
                      {
                        className: '!border-l-4 !border-green-500 !rounded-none !rounded-r-md',
                      }
                    );
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-[12px] font-bold uppercase px-5 py-2.5 rounded-md transition-colors flex items-center gap-2"
                >
                  <span className="text-[15px] leading-none">↻</span> Cập nhật giỏ hàng
                </button>
              </div>

              {/* Summary Box */}
              <div className="mt-8 flex justify-end">
                <div className="bg-gray-50 p-6 rounded-lg w-full md:w-[320px]">
                  <h3 className="text-[15px] font-bold text-gray-800 uppercase mb-4">Tổng tiền</h3>
                  <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-5">
                    <span className="text-gray-800 text-sm font-medium">Tổng</span>
                    <span className="text-green-600 font-bold text-[16px]">{Number(total).toLocaleString()} ₫</span>
                  </div>
                  <button 
                    onClick={() => {
                      const storedUser = localStorage.getItem('user');
                      if (!storedUser) {
                        toast.info(
                          <div>
                            <div className="font-bold text-gray-800 text-base mb-1">Yêu cầu đăng nhập</div>
                            <div className="text-gray-600 text-sm">Vui lòng đăng nhập hoặc đăng ký để mua hàng</div>
                          </div>
                        );
                        navigate('/auth', { state: { from: '/cart', autoCheckout: true } });
                        return;
                      }
                      setShowCheckout(true);
                    }} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold uppercase py-3 rounded-full transition-colors"
                  >
                    Thanh toán
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

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