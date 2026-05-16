import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import OrderList from "../pages/admin/orders/OrderList";

import CreateOrder from "../pages/admin/orders/CreateOrder";

import EditOrder from "../pages/admin/orders/EditOrder";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/orders"
          element={<OrderList />}
        />

        <Route
          path="/admin/orders/create"
          element={<CreateOrder />}
        />

        <Route
          path="/admin/orders/edit/:id"
          element={<EditOrder />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;