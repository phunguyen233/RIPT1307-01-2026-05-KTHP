const express = require("express");

const {
  createOrder,
  getOrders,
  getOrderDetail,
  updateOrder,
  deleteOrder,
  getMyOrders,
} = require("../controllers/orders");

const router = express.Router();

router.get(
  "/my-orders",
  getMyOrders
);

router.get("/", getOrders);

router.get("/:id", getOrderDetail);

router.post("/", createOrder);

router.put("/:id", updateOrder);

router.delete("/:id", deleteOrder);

module.exports = router;
