const db = require("../config/db");

// Get all orders
const getMyOrders = async (
  req,
  res
) => {
  try {
    const result =
      await db.query(
        `
        SELECT *
        FROM orders
        ORDER BY id DESC
        `
      );

    res.json({
      success: true,

      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Get order detail
const getOrderById = async (
  req,
  res
) => {
  try {
    const result =
      await db.query(
        `
        SELECT *
        FROM orders
        WHERE id = $1
        `,
        [req.params.id]
      );

    res.json({
      success: true,

      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getMyOrders,
  getOrderById,
};