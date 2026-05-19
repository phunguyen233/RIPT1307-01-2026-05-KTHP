const express = require("express");

const cors = require("cors");

require("dotenv").config();

const orderRoute = require("./routes/orderRoute");
const cartRoute = require("./routes/cartRoute")
const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/orders", orderRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});