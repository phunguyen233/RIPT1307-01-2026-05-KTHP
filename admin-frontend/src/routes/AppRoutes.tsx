import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import AdminOrders from "../pages/admin/orders/AdminOrders";

import CreateOrder from "../pages/admin/orders/CreateOrder";

import EditOrder from "../pages/admin/orders/EditOrder";

import Customers from "../pages/admin/customers/CustomerList";

const AdminRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/orders"
          element={
            <AdminOrders />
          }
        />

        <Route
          path="/admin/orders/create"
          element={
            <CreateOrder />
          }
        />

        <Route
          path="/admin/orders/edit/:id"
          element={
            <EditOrder />
          }
        />

        <Route
          path="/admin/customers"
          element={
            <Customers />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AdminRoutes;