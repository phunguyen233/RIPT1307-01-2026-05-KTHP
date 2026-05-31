const db = require('../config/db');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM shops)::INT AS total_shops,
        (SELECT COUNT(*) FROM customers)::INT AS total_customers,
        (SELECT COUNT(*) FROM products)::INT AS total_products,
        (SELECT COUNT(*) FROM orders)::INT AS total_orders
    `);

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

exports.getShopsStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        s.id,
        s.name,
        s.email,
        s.created_at,
        COALESCE(c.customer_count, 0)::INT AS customer_count,
        COALESCE(p.product_count, 0)::INT AS product_count,
        COALESCE(o.order_count, 0)::INT AS order_count,
        COALESCE(o.total_revenue, 0)::BIGINT AS revenue
      FROM shops s
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS customer_count
        FROM customers
        GROUP BY shop_id
      ) c ON c.shop_id = s.id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS product_count
        FROM products
        GROUP BY shop_id
      ) p ON p.shop_id = s.id
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS order_count, COALESCE(SUM(total_price), 0) AS total_revenue
        FROM orders
        GROUP BY shop_id
      ) o ON o.shop_id = s.id
      ORDER BY s.id
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

exports.getAdminUsers = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.shop_id,
        COALESCE(c.customer_count, 0)::INT AS customer_count
      FROM users u
      LEFT JOIN (
        SELECT shop_id, COUNT(*) AS customer_count
        FROM customers
        GROUP BY shop_id
      ) c ON c.shop_id = u.shop_id
      WHERE u.role = 'admin'
      ORDER BY u.id
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};
