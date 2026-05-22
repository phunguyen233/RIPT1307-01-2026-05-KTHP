const pool = require("../config/db");

//
// SHOP
//

// Get my orders
exports.getMyOrders =
  async (req, res) => {
    try {
      const customerId =
        req.user.id;

      const result =
        await pool.query(
          `
          SELECT *
          FROM orders
          WHERE customer_id = $1
          ORDER BY id DESC
          `,
          [customerId]
        );

      res.status(200).json({
        success: true,

        data: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };

// Get order detail
exports.getOrderDetail =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const result =
        await pool.query(
          `
          SELECT *
          FROM orders
          WHERE id = $1
          `,
          [id]
        );

      res.status(200).json({
        success: true,

        data:
          result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };

// Create order
exports.createOrder =
  async (req, res) => {
    try {
      const {
        customer_name,

        total_amount,

        status,
      } = req.body;

      const customerId =
        req.user.id;

      const result =
        await pool.query(
          `
          INSERT INTO orders
          (
            customer_id,
            customer_name,
            total_amount,
            status
          )

          VALUES ($1,$2,$3,$4)

          RETURNING *
          `,
          [
            customerId,

            customer_name,

            total_amount,

            status ||
              "pending",
          ]
        );

      res.status(201).json({
        success: true,

        data:
          result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };

//
// ADMIN
//

// Get all orders
exports.getOrders =
  async (req, res) => {
    try {
      const result =
        await pool.query(
          `
          SELECT *
          FROM orders
          ORDER BY id DESC
          `
        );

      res.status(200).json({
        success: true,

        data: result.rows,
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };

// Update order
exports.updateOrder =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const {
        customer_name,

        total_amount,

        status,
      } = req.body;

      const result =
        await pool.query(
          `
          UPDATE orders

          SET
            customer_name = $1,
            total_amount = $2,
            status = $3

          WHERE id = $4

          RETURNING *
          `,
          [
            customer_name,

            total_amount,

            status,

            id,
          ]
        );

      res.status(200).json({
        success: true,

        data:
          result.rows[0],
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };

// Delete order
exports.deleteOrder =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      await pool.query(
        `
        DELETE FROM orders
        WHERE id = $1
        `,
        [id]
      );

      res.status(200).json({
        success: true,

        message:
          "Delete order successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,

        message:
          error.message,
      });
    }
  };