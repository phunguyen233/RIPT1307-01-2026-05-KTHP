import {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import orderAPI from "../../../api/orderAPI";

import OrderTable from "../../../components/orders/OrderTable";

const OrderList = () => {
  const navigate = useNavigate();

  const [orders, setOrders] =
    useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      const data =
        await orderAPI.getOrders();

      setOrders(data.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (
    id: number
  ) => {
    try {
      await orderAPI.deleteOrder(id);

      fetchOrders();
    } catch (error) {
      console.log(error);
    }
  };

  const handleEdit = (id: number) => {
    navigate(
      `/admin/orders/edit/${id}`
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">
          Orders
        </h1>

        <button
          onClick={() =>
            navigate(
              "/admin/orders/create"
            )
          }
          className="bg-black text-white px-4 py-2 rounded"
        >
          Create Order
        </button>
      </div>

      <OrderTable
        orders={orders}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </div>
  );
};

export default OrderList;