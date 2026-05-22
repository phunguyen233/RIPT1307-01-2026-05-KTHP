import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Cart from "../pages/shop/cart/Cart";

import MyOrders from "../pages/shop/orders/MyOrders";

import OrderDetail from "../pages/shop/orders/OrderDetail";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/orders"
          element={<MyOrders />}
        />

        <Route
          path="/orders/:id"
          element={
            <OrderDetail />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;