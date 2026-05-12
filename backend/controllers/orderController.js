const db = require("../config/db");

const getOrders = async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT *
        FROM orders
        ORDER BY created_at DESC
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

const getOrderById = async (
  req,
  res
) => {
  try {
    const result = await db.query(
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

const createOrder = async (
  req,
  res
) => {
  try {
    const {
      customerName,
      phone,
      address,
      status,
      totalAmount,
    } = req.body;

    const result = await db.query(
      `
        INSERT INTO orders
        (
          customer_name,
          phone,
          address,
          status,
          total_amount
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `,
      [
        customerName,
        phone,
        address,
        status,
        totalAmount,
      ]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateOrder = async (
  req,
  res
) => {
  try {
    const {
      customerName,
      phone,
      address,
      status,
      totalAmount,
    } = req.body;

    const result = await db.query(
      `
        UPDATE orders
        SET
          customer_name = $1,
          phone = $2,
          address = $3,
          status = $4,
          total_amount = $5
        WHERE id = $6
        RETURNING *
      `,
      [
        customerName,
        phone,
        address,
        status,
        totalAmount,
        req.params.id,
      ]
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

const deleteOrder = async (
  req,
  res
) => {
  try {
    await db.query(
      `
        DELETE FROM orders
        WHERE id = $1
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      message:
        "Delete successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
};