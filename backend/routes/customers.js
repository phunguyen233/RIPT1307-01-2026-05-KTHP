const express = require("express");

const router = express.Router();

const {
  getCustomers,
} = require("../controllers/customers");

router.get("/", getCustomers);

module.exports = router;