const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.get("/", getOrders);

router.get("/:id", getOrderById);

router.post("/", createOrder);

router.put("/:id", updateOrder);

router.delete("/:id", deleteOrder);

module.exports = router;