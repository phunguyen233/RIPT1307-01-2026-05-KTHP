const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateApiKey } = require('../utils/apiKeyGenerator');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Hàm validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getShopIdFromApiKey = async (apiKey) => {
  if (!apiKey) return null;
  const result = await db.query('SELECT id FROM shops WHERE api_key = $1', [apiKey]);
  return result.rows.length > 0 ? result.rows[0].id : null;
};

// ĐĂNG KÝ ADMIN (chỉ cho admin-frontend)
exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password, shop_name, shop_email } = req.body;

    // Validate input
    if (!name || !email || !password || !shop_name) {
      return res.status(400).json({ error: 'Name, email, password, and shop_name are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate API key
    const apiKey = generateApiKey();

    // Create shop first
    const shopResult = await db.query(
      'INSERT INTO shops (name, email, api_key) VALUES ($1, $2, $3) RETURNING id, name, email, api_key, created_at',
      [shop_name, shop_email || null, apiKey]
    );
    
    const shopId = shopResult.rows[0].id;

    // Create user with shop_id
    const userResult = await db.query(
      'INSERT INTO users (name, email, password, role, shop_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, shop_id, created_at',
      [name, email, hashedPassword, 'admin', shopId]
    );

    const user = userResult.rows[0];

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        shop_id: user.shop_id,
        api_key: apiKey
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      user: {
        ...user,
        api_key: apiKey
      },
      token,
      shop: shopResult.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// ĐĂNG KÝ KHÁCH HÀNG (chỉ cho shop-frontend và ShopAIApp)
exports.register = async (req, res, next) => {
  try {
    const { name, ten_dang_nhap, ho_ten, email, mat_khau, password, phone, address, shop_id, api_key } = req.body;
    const userName = (name || ten_dang_nhap || ho_ten || '').trim();
    const userPassword = password || mat_khau;
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['X-API-Key'];

    // Validate input
    if (!userName || !email || !userPassword) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (userPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let resolvedShopId = null;
    if (apiKeyHeader) {
      resolvedShopId = await getShopIdFromApiKey(apiKeyHeader);
      if (!resolvedShopId) {
        return res.status(401).json({ error: 'Invalid shop API key' });
      }
    } else if (shop_id && api_key) {
      const shopExists = await db.query(
        'SELECT id FROM shops WHERE id = $1 AND api_key = $2',
        [shop_id, api_key]
      );
      if (shopExists.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid shop credentials' });
      }
      resolvedShopId = shop_id;
    } else {
      return res.status(400).json({ error: 'Shop API key is required to register a customer' });
    }

    // Kiểm tra email đã tồn tại
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    // Tạo user mới với role customer
    const userResult = await db.query(
      'INSERT INTO users (name, email, password, role, shop_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, shop_id, created_at',
      [userName, email, hashedPassword, 'customer', resolvedShopId]
    );
    const user = userResult.rows[0];

    // Create linked customer record for this user
    const codeQuery = `SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 3) AS INTEGER)), 0) + 1 AS next_number
                       FROM customers WHERE shop_id = $1 AND customer_code LIKE 'KH%'`;
    const codeResult = await db.query(codeQuery, [resolvedShopId]);
    const nextNumber = codeResult.rows[0].next_number;
    const customer_code = 'KH' + nextNumber.toString();

    await db.query(
      'INSERT INTO customers (user_id, name, phone, address, total_spent, shop_id, customer_code) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [user.id, userName, phone || null, address || null, 0, resolvedShopId, customer_code]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// ĐĂNG NHẬP
exports.login = async (req, res, next) => {
  try {
    const { email, ten_dang_nhap, mat_khau, password } = req.body;
    const identifier = email || ten_dang_nhap;
    const userPassword = password || mat_khau;
    const apiKeyHeader = req.headers['x-api-key'] || req.headers['X-API-Key'];

    // Validate input
    if (!identifier || !userPassword) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    let user;
    let resolvedShopId = null;

    if (apiKeyHeader) {
      resolvedShopId = await getShopIdFromApiKey(apiKeyHeader);
      if (!resolvedShopId) {
        return res.status(401).json({ error: 'Invalid shop API key' });
      }

      // Tìm user theo email hoặc tên đăng nhập trong cùng shop
      const result = await db.query(
        'SELECT * FROM users WHERE (email = $1 OR name = $1) AND shop_id = $2',
        [identifier, resolvedShopId]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials or wrong shop' });
      }

      user = result.rows[0];

      if (user.role !== 'customer') {
        return res.status(403).json({ error: 'Only customer accounts can login here' });
      }
    } else {
      // Admin login from admin frontend does not require shop API key
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1 OR name = $1',
        [identifier]
      );
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      user = result.rows[0];

      if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'staff') {
        return res.status(403).json({ error: 'Only admin, staff, or superadmin accounts can login here' });
      }

      resolvedShopId = user.shop_id;
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(userPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        shop_id: user.shop_id
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shop_id: user.shop_id,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

// Middleware xác thực token
exports.verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Middleware xác thực API key
exports.verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const result = await db.query('SELECT id FROM shops WHERE api_key = $1', [apiKey]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.shopId = result.rows[0].id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
};

// Lấy API key của shop hiện tại
exports.getCurrentShopApiKey = async (req, res, next) => {
  try {
    const { user } = req;
    
    if (!user || !user.shop_id) {
      return res.status(404).json({ error: 'User has no shop' });
    }

    const result = await db.query(
      'SELECT id, name, email, api_key, created_at FROM shops WHERE id = $1',
      [user.shop_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

// Tạo lại API key mới cho shop hiện tại
exports.regenerateApiKey = async (req, res, next) => {
  try {
    const { user } = req;
    
    if (!user || !user.shop_id) {
      return res.status(404).json({ error: 'User has no shop' });
    }

    const newApiKey = generateApiKey();

    const result = await db.query(
      'UPDATE shops SET api_key = $1 WHERE id = $2 RETURNING id, name, email, api_key, created_at',
      [newApiKey, user.shop_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.getStaffUsers = async (req, res, next) => {
  try {
    console.log('getStaffUsers USER:', req.user);
    const shopId = req.user?.shop_id;
    if (!shopId) {
      return res.status(400).json({ error: 'Shop ID is required' });
    }
    const result = await db.query(
      'SELECT id, name, email, role, shop_id, created_at FROM users WHERE role = $1 AND shop_id = $2 ORDER BY created_at DESC',
      ['staff', shopId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, name, email, role, shop_id, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT id, name, email, role, shop_id, created_at FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  try {
    console.log('createUser BODY:', req.body);
    console.log('createUser USER:', req.user);

    const { name, email, password, role, shop_id } = req.body;
    const tokenShopId = req.user?.shop_id;
    const effectiveShopId = tokenShopId || shop_id;

    if (!effectiveShopId) {
      return res.status(400).json({ error: 'Shop ID is required to create a user' });
    }
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email đã tồn tại' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await db.query(
      'INSERT INTO users (name, email, password, role, shop_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, shop_id, created_at',
      [name, email, hashedPassword, role || 'customer', effectiveShopId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, role, shop_id } = req.body;
    const result = await db.query(
      'UPDATE users SET name = $1, email = $2, role = $3, shop_id = $4 WHERE id = $5 RETURNING id, name, email, role, shop_id, created_at',
      [name, email, role, shop_id || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
