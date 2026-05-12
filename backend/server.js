const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// 1. IMPORT ROUTES
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categoryRoutes');
// const productRoutes = require('./routes/productRoutes'); // Nếu có file này thì mở comment ra

const app = express();

// ============ MIDDLEWARE ============

// Cấu hình CORS chuẩn (Gộp từ cả 2 file của mày)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
  allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization,X-API-Key'
}));

// Xử lý dữ liệu JSON và Form (Giới hạn 50mb để sau này up ảnh cho sướng)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Log request để mày nhìn ở terminal cho dễ debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ ROUTES ============

// Route kiểm tra server chạy hay chưa
app.get('/', (req, res) => {
  res.send('🚀 Backend Server đã hợp nhất và đang hoạt động...');
});

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Mapping API cho từng module
app.use('/api/users', userRoutes);      // Route của Phú
app.use('/api/admin', userRoutes);      // Route admin của Phú
app.use('/categories', categoryRoutes);   // Route Danh mục của Minh
// app.use('/products', productRoutes);    // Route Sản phẩm của Minh (nếu có)

// ============ ERROR HANDLING ============

// Xử lý khi gõ sai đường dẫn API (404)
app.use((req, res) => {
  res.status(404).json({ error: 'Route không tồn tại!' });
});

// Bộ lọc lỗi hệ thống (Global Error Handler)
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: err.message || 'Lỗi server nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============ SERVER STARTUP ============

const port = parseInt(process.env.PORT, 10) || 4000;

app.listen(port, () => {
  console.log(`\n==============================================`);
  console.log(`🚀 Server chạy tại: http://localhost:${port}`);
  console.log(`📂 Danh sách API: /categories, /api/users`);
  console.log(`==============================================\n`);
});

// Chống sập server khi gặp lỗi bất ngờ
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

module.exports = app;