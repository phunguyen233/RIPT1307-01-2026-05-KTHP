const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ============ 1. IMPORT ROUTES ============
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// ============ 2. MIDDLEWARE (BẮT BUỘC PHẢI Ở TRÊN CÙNG) ============

// Cấu hình CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
  allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key'
}));

// Parse Body - Dùng bản built-in của Express (chuẩn và gọn nhất, không bị trùng)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Log request để dễ debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ 3. MAPPING ROUTES ============

// Route test server
app.get('/', (req, res) => {
  res.send('🚀 Backend Server đã hợp nhất và đang hoạt động...');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Mapping chuẩn cho tất cả API
app.use('/api/users', userRoutes);
app.use('/api/admin', userRoutes);
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);

// ============ 4. ERROR HANDLING ============

// Xử lý 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại!' });
});

// Xử lý lỗi hệ thống 500
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: err.message || 'Lỗi server nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============ 5. SERVER STARTUP ============

const port = parseInt(process.env.PORT, 10) || 4000;

app.listen(port, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 Server chạy tại: http://localhost:${port}`);
  console.log(`📂 Danh sách API: /categories, /products, /api/users`);
  console.log(`==============================================\n`);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;