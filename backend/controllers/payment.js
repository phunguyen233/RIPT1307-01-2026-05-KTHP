const crypto = require('crypto');
const qs = require('qs');
const ordersController = require('./orders');
const db = require('../config/db');
require('dotenv').config();

const VN_PAY_URL = process.env.VNP_URL;
const VNP_TMNCODE = process.env.VNP_TMNCODE;
const VNP_HASHSECRET = process.env.VNP_HASHSECRET;
const VNP_RETURN_URL = process.env.VNP_RETURN_URL;
const SEPAY_SECRET = process.env.SEPAY_SECRET;
const SEPAY_BANK_NAME = process.env.BANK_NAME;
const SEPAY_BANK_ACCOUNT = process.env.BANK_ACCOUNT;
const SEPAY_ACCOUNT_NAME = process.env.ACCOUNT_NAME;
const SEPAY_QR_HOST = process.env.SEPAY_QR_HOST || 'https://qr.sepay.vn/img';
const SEPAY_QR_TEMPLATE = process.env.SEPAY_QR_TEMPLATE || 'compact';

const pad = (value) => value.toString().padStart(2, '0');

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.connection?.remoteAddress || req.socket?.remoteAddress || req.ip || '';
};

const hasSePayConfig = () => {
  return Boolean(SEPAY_SECRET && SEPAY_BANK_NAME && SEPAY_BANK_ACCOUNT && SEPAY_ACCOUNT_NAME);
};

const generateSepayQr = () => {
  if (!hasSePayConfig()) {
    throw new Error('SePay configuration is missing');
  }

  const qrUrl = `${SEPAY_QR_HOST}?bank=${encodeURIComponent(SEPAY_BANK_NAME)}&acc=${encodeURIComponent(SEPAY_BANK_ACCOUNT)}&template=${encodeURIComponent(SEPAY_QR_TEMPLATE)}`;
  return {
    qrUrl,
    bankName: SEPAY_BANK_NAME,
    bankAccount: SEPAY_BANK_ACCOUNT,
    accountName: SEPAY_ACCOUNT_NAME,
  };
};

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).map((key) => encodeURIComponent(key)).sort();

  keys.forEach((encodedKey) => {
    const originalKey = decodeURIComponent(encodedKey);
    const value = obj[originalKey];
    sorted[encodedKey] = encodeURIComponent(value).replace(/%20/g, '+');
  });

  return sorted;
};

exports.generateVnPayUrl = async (req, res, next) => {
  try {
    if (!VN_PAY_URL || !VNP_TMNCODE || !VNP_HASHSECRET || !VNP_RETURN_URL) {
      return res.status(500).json({ error: 'VNPay configuration is missing' });
    }

    const amount = Number(req.query.amount || req.body.amount);
    const info = String(req.query.info || req.body.info || '').trim();
    const orderId = String(req.query.orderId || req.body.orderId || Date.now().toString()).trim();

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount phải lớn hơn 0' });
    }
    if (!info) {
      return res.status(400).json({ error: 'Info thanh toán là bắt buộc' });
    }

    const createdAt = new Date();
    const createDate = formatDate(createdAt);
    const ipAddr = getClientIp(req);

    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: VNP_TMNCODE,
      vnp_Amount: String(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: info,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: VNP_RETURN_URL,
      vnp_CreateDate: createDate,
      vnp_IpAddr: ipAddr,
    };

    const sortedParams = sortObject(vnpParams);
    const signData = qs.stringify(sortedParams, { encode: false });

    const secureHash = crypto
      .createHmac('sha512', VNP_HASHSECRET)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    sortedParams.vnp_SecureHash = secureHash;
    const paymentUrl = `${VN_PAY_URL}?${qs.stringify(sortedParams, { encode: false })}`;

    return res.json({ method: 'VNPAY', redirectUrl: paymentUrl });
  } catch (error) {
    next(error);
  }
};

exports.checkout = async (req, res, next) => {
  if (hasSePayConfig()) {
    try {
      const amount = Number(req.query.amount || req.body.amount);
      const info = String(req.query.info || req.body.info || '').trim();
      const orderId = String(req.query.orderId || req.body.orderId || Date.now().toString()).trim();

      if (!amount || Number.isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Amount phải lớn hơn 0' });
      }
      if (!info) {
        return res.status(400).json({ error: 'Info thanh toán là bắt buộc' });
      }

      const sepayData = generateSepayQr();
      return res.json({
        method: 'SEPAY',
        qrUrl: sepayData.qrUrl,
        bankName: sepayData.bankName,
        bankAccount: sepayData.bankAccount,
        accountName: sepayData.accountName,
        amount,
        orderId,
      });
    } catch (error) {
      return next(error);
    }
  }
  return exports.generateVnPayUrl(req, res, next);
};

exports.handleSePayWebhook = async (req, res, next) => {
  try {
    const secret = req.headers['x-sepay-secret'] || req.body.secret || req.query.secret;
    if (!secret || secret !== SEPAY_SECRET) {
      return res.status(401).json({ error: 'Invalid SePay webhook secret' });
    }

    const orderId = req.body.orderId || req.body.order_id || req.body.order_code || req.body.orderCode;
    const status = String(req.body.status || req.body.payment_status || '').toLowerCase();

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    if (!['paid', 'completed', 'success'].includes(status)) {
      return res.status(200).json({ message: 'Webhook received but no action taken' });
    }

    const orderQuery = await db.query(
      'SELECT id, shop_id, status FROM orders WHERE id = $1 OR order_code = $1',
      [orderId]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderQuery.rows[0];
    if (order.status === 'completed') {
      return res.json({ message: 'Order already completed', order });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is cancelled and cannot be completed' });
    }

    const fakeReq = { params: { id: order.id }, user: { shop_id: order.shop_id } };
    return ordersController.processOrder(fakeReq, res, next);
  } catch (error) {
    next(error);
  }
};
