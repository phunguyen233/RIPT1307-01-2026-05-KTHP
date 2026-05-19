const db = require("../config/db");

const getCart = async (
  req,
  res
) => {
  try {
    const result =
      await db.query(
        "SELECT * FROM cart"
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

const addToCart = async (
  req,
  res
) => {
  try {
    const {
      product_name,
      price,
      quantity,
    } = req.body;

    await db.query(
      `
      INSERT INTO cart
      (
        product_name,
        price,
        quantity
      )
      VALUES ($1, $2, $3)
      `,
      [
        product_name,
        price,
        quantity,
      ]
    );

    res.json({
      success: true,

      message:
        "Added to cart",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const removeCartItem = async (
  req,
  res
) => {
  try {
    await db.query(
      "DELETE FROM cart WHERE id = $1",
      [req.params.id]
    );

    res.json({
      success: true,

      message:
        "Removed from cart",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  removeCartItem,
};