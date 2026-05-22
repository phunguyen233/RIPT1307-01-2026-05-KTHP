import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import MyOrders from "../pages/shop/orders/MyOrders";

import OrderDetail from "../pages/shop/orders/OrderDetail";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/shop/orders"
          element={<MyOrders />}
        />

        <Route
          path="/shop/orders/:id"
          element={<OrderDetail />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;