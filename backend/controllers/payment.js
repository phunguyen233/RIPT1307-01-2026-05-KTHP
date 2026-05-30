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
    // Verify signature header and timestamp to prevent replay attacks
    const sigHeader = req.headers['x-sepay-signature'] || req.headers['x-sepay-signature'.toLowerCase()];
    const tsHeader = req.headers['x-sepay-timestamp'] || req.headers['x-sepay-timestamp'.toLowerCase()];

    if (!sigHeader) {
      return res.status(401).json({ error: 'Missing X-SePay-Signature header' });
    }
    if (!tsHeader) {
      return res.status(401).json({ error: 'Missing X-SePay-Timestamp header' });
    }

    // Accept header like: "sha256=<hex>" or just the hex
    let signature = String(sigHeader);
    if (signature.startsWith('sha256=')) {
      signature = signature.slice('sha256='.length);
    }

    const timestamp = parseInt(String(tsHeader), 10);
    if (Number.isNaN(timestamp)) {
      return res.status(400).json({ error: 'Invalid X-SePay-Timestamp' });
    }

    const now = Math.floor(Date.now() / 1000);
    const tolerance = Number(process.env.SEPAY_TOLERANCE_SECONDS || 300);
    if (Math.abs(now - timestamp) > tolerance) {
      return res.status(400).json({ error: 'Stale request (possible replay)'});
    }

    const rawBody = req.rawBody || JSON.stringify(req.body || {});
    const computedHash = crypto.createHmac('sha256', SEPAY_SECRET).update(rawBody).digest('hex');

    // Use timingSafeEqual for comparison
    const sigBuf = Buffer.from(signature, 'hex');
    const compBuf = Buffer.from(computedHash, 'hex');
    if (sigBuf.length !== compBuf.length || !crypto.timingSafeEqual(sigBuf, compBuf)) {
      return res.status(401).json({ error: 'Invalid signature' });
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

// Create order in DB and return SePay QR data
exports.createSepayOrder = async (req, res, next) => {
  try {
    if (!hasSePayConfig()) {
      return res.status(500).json({ error: 'SePay configuration is missing' });
    }

    const shop_id = req.user.shop_id;
    const { customer_id, shipping_address, total_price, order_items, items } = req.body;
    const requestedOrderId = req.body.orderId || req.body.order_id || req.body.order || null;

    // If an existing order id is provided, use it instead of creating a new order
    if (requestedOrderId) {
      const orderQuery = await db.query('SELECT * FROM orders WHERE id = $1 AND shop_id = $2', [requestedOrderId, shop_id]);
      if (orderQuery.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      const existingOrder = orderQuery.rows[0];
      const amount = Number(existingOrder.total_price || 0);
      const order_code = existingOrder.order_code || existingOrder.id;
      const sepayData = generateSepayQr();
      return res.status(200).json({
        order: existingOrder,
        method: 'SEPAY',
        qrUrl: `${sepayData.qrUrl}&amount=${encodeURIComponent(amount)}&info=${encodeURIComponent(order_code)}`,
        amount,
        orderCode: order_code,
        bankName: sepayData.bankName,
        bankAccount: sepayData.bankAccount,
        accountName: sepayData.accountName,
      });
    }

    const amount = Number(total_price || req.body.amount || 0);
    const info = String(req.body.info || req.body.note || `Thanh toán đơn hàng`).trim();

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount phải lớn hơn 0' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // generate order_code similar to orders.createOrder
      const codeQuery = `SELECT COALESCE(MAX(CAST(SUBSTRING(order_code FROM 3) AS INTEGER)), 0) + 1 AS next_number
                         FROM orders WHERE shop_id = $1 AND order_code LIKE 'DH%'`;
      const codeResult = await client.query(codeQuery, [shop_id]);
      const nextNumber = codeResult.rows[0].next_number;
      const order_code = 'DH' + nextNumber.toString();

      const validCustomerId = customer_id && !isNaN(customer_id) ? customer_id : null;
      const orderResult = await client.query(
        'INSERT INTO orders (customer_id, shipping_address, total_price, status, shop_id, order_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [validCustomerId, shipping_address || null, amount || 0, 'pending', shop_id, order_code]
      );

      const newOrder = orderResult.rows[0];

      const orderItemsToInsert = order_items || items || [];
      const insertedItems = [];
      if (orderItemsToInsert.length > 0) {
        for (const item of orderItemsToInsert) {
          const itemResult = await client.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [newOrder.id, item.product_id || item.ma_san_pham, item.quantity || item.so_luong, item.price || item.don_gia]
          );
          insertedItems.push(itemResult.rows[0]);
        }
      }

      await client.query('COMMIT');

      const sepayData = generateSepayQr();
      return res.status(201).json({
        order: { ...newOrder, order_items: insertedItems },
        method: 'SEPAY',
        qrUrl: `${sepayData.qrUrl}&amount=${encodeURIComponent(amount)}&info=${encodeURIComponent(order_code)}`,
        amount,
        orderCode: order_code,
        bankName: sepayData.bankName,
        bankAccount: sepayData.bankAccount,
        accountName: sepayData.accountName,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

// Cancel order (from QR modal)
exports.cancelSepayOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop_id = req.user.shop_id;

    const orderCheck = await db.query('SELECT status FROM orders WHERE id = $1 AND shop_id = $2', [id, shop_id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const currentStatus = orderCheck.rows[0].status;
    if (currentStatus === 'completed' || currentStatus === 'cancelled') {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    const result = await db.query('UPDATE orders SET status = $1 WHERE id = $2 AND shop_id = $3 RETURNING *', ['cancelled', id, shop_id]);
    res.json({ message: 'Order cancelled', order: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Mark paid clicked by customer — does not finalize until webhook confirms
exports.markSepayOrderPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const shop_id = req.user.shop_id;

    const orderCheck = await db.query('SELECT id, status FROM orders WHERE id = $1 AND shop_id = $2', [id, shop_id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Do not change status here. Webhook will verify and call processOrder to complete.
    return res.json({ message: 'Marked as customer-paid (awaiting SePay confirmation)', order: orderCheck.rows[0] });
  } catch (error) {
    next(error);
  }
};
