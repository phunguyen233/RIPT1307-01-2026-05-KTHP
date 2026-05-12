const {
  createOrderService,
  getOrdersService,
  getOrderByIdService,
  updateOrderService,
  deleteOrderService,
} = require("../services/orderService");

const createOrder = async (req, res) => {
  try {
    const order = await createOrderService(
      req.body
    );

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Create order failed",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await getOrdersService();

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Get orders failed",
    });
  }
};

const getOrderById = async (
  req,
  res
) => {
  try {
    const order =
      await getOrderByIdService(
        req.params.id
      );

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Get order failed",
    });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order =
      await updateOrderService(
        req.params.id,
        req.body
      );

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Update failed",
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    await deleteOrderService(
      req.params.id
    );

    res.json({
      success: true,
      message:
        "Delete successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};