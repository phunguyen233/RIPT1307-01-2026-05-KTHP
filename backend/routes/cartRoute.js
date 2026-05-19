const express = require("express");

const router = express.Router();

const {
  getCart,
  addToCart,
  removeCartItem,
} = require("../controllers/cartController");

router.get("/", getCart);

router.post("/", addToCart);

router.delete(
  "/:id",
  removeCartItem
);

module.exports = router;