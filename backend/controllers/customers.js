const db = require("../config/db");

const getCustomers = async (
  req,
  res
) => {
  try {
    const result =
      await db.query(
        "SELECT * FROM customers ORDER BY id DESC"
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

module.exports = {
  getCustomers,
};