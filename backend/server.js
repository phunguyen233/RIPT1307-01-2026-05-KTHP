require('dotenv').config();
const express = require('express');
const cors = require('cors');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Middleware
app.use(cors()); // Cho phép Frontend gọi API
app.use(express.json()); // Xử lý dữ liệu JSON từ request body

// Cấu hình endpoint cho các module
app.use('/categories', categoryRoutes);
app.use('/products', productRoutes);

// Route kiểm tra server
app.get('/', (req, res) => {
  res.send('Backend Server đang hoạt động...');
});

// Khởi tạo server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});