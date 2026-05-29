import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type Props = {
  maDonHang?: number | null; // optional order id
  amount?: number; // optional prefilled amount
  info?: string; // optional prefilled info/content
  onClose?: () => void;
  onCancelled?: (maDonHang: number) => void;
  onPaid?: (maDonHang?: number) => void;
};

export default function PaymentModal({ maDonHang = null, amount: initAmount = 0, info: initInfo = "", onClose, onCancelled, onPaid }: Props) {
  const [amount, setAmount] = useState<number>(initAmount);
  const [info, setInfo] = useState<string>(initInfo);
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if ((amount !== undefined && amount !== null) && info && info.trim() !== "") {
      createPaymentLink();
    }
  }, [amount, info]);

  const createPaymentLink = async () => {
    if (!amount || !info) {
      setErrorMessage("Nhập số tiền và nội dung!");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setPaymentMethod(null);
      setQrUrl("");
      const backendBaseUrl = process.env.REACT_APP_SHOP_API_URL || process.env.REACT_APP_BACKEND_URL || 'https://bepmam-backend.onrender.com/api';
      const backendUrl = backendBaseUrl.replace(/\/+$/, '');
      const res = await axios.get(`${backendUrl}/payment/checkout`, {
        params: {
          amount,
          info,
          orderId: maDonHang,
        },
      });

      if (res.data?.method === 'SEPAY' && res.data.qrUrl) {
        setPaymentMethod('SEPAY');
        setQrUrl(res.data.qrUrl);
        setBankName(res.data.bankName || '');
        setBankAccount(res.data.bankAccount || '');
        setAccountName(res.data.accountName || '');
        return;
      }

      const redirectUrl = res.data?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }

      setErrorMessage("Không nhận được liên kết thanh toán.");
    } catch (err) {
      console.log(err);
      setErrorMessage("Lỗi tạo liên kết thanh toán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async () => {
    if (!maDonHang) {
      alert("Không có mã đơn hàng để hủy.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;

    try {
      setLoading(true);
      const backendBaseUrl = process.env.REACT_APP_SHOP_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000/api';
      const backendUrl = backendBaseUrl.replace(/\/+$/, '');
      const res = await axios.post(`${backendUrl}/payment/cancel`, { ma_don_hang: maDonHang });
      if (res.data && res.data.success) {
        alert("Đã hủy đơn hàng.");
        onCancelled && onCancelled(maDonHang);
        onClose && onClose();
      } else {
        alert(res.data.message || "Hủy đơn thất bại");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi hủy đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const markPaid = () => {
    // If parent provided onPaid, call it so it can clear cart / update UI
    if (onPaid) {
      try {
        onPaid(maDonHang ?? undefined);
      } catch (e) {
        console.error('onPaid handler error', e);
      }
    }
    // navigate to order history with a message
    navigate('/orders-history', { state: { infoModal: 'vui lòng chờ đơn hàng được xác nhận.' } });
    onClose && onClose();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md w-[350px] max-w-full">
      <h2 className="text-xl font-bold mb-3">Thanh toán {paymentMethod === 'SEPAY' ? 'SePay' : 'VNPay'}</h2>

      {errorMessage ? (
        <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : paymentMethod === 'SEPAY' ? (
        <div className="space-y-4 text-center">
          <p className="text-gray-700">Quét mã QR bên dưới để chuyển khoản qua SePay.</p>
          {qrUrl ? (
            <div className="flex justify-center">
              <img src={qrUrl} alt="Mã QR SePay" className="max-h-[320px] rounded-lg shadow-sm" />
            </div>
          ) : (
            <p className="text-sm text-gray-500">Đang tải mã QR...</p>
          )}
          <div className="text-left text-sm text-gray-700">
            <p><strong>Ngân hàng:</strong> {bankName}</p>
            <p><strong>Số tài khoản:</strong> {bankAccount}</p>
            <p><strong>Chủ tài khoản:</strong> {accountName}</p>
            <p><strong>Số tiền:</strong> {Number(amount).toLocaleString()} ₫</p>
          </div>
          <p className="text-sm text-gray-500">Sau khi chuyển khoản xong, hệ thống sẽ cập nhật trạng thái đơn hàng tự động.</p>
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-gray-700">Đang tạo liên kết thanh toán...</p>
          {loading && <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát.</p>}
        </div>
      )}
    </div>
  );
}
