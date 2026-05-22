import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import adminOrderAPI from "../../../api/adminOrderAPI";

const AdminOrders = () => {
  const [orders, setOrders] =
    useState<any[]>([]);

  const fetchOrders =
    async () => {
      try {
        const data =
          await adminOrderAPI.getOrders();

        setOrders(data.data);
      } catch (error) {
        console.log(error);
      }
    };

  const handleDelete =
    async (id: number) => {
      try {
        await adminOrderAPI.deleteOrder(
          id
        );

        fetchOrders();
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Admin Orders
        </h1>

        <Link
          to="/admin/orders/create"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create Order
        </Link>
      </div>

      {orders.map((order) => (
        <div
          key={order.id}
          className="border rounded p-4 mb-4"
        >
          <p>
            Order ID:
            {" "}
            {order.id}
          </p>

          <p>
            Customer:
            {" "}
            {
              order.customer_name
            }
          </p>

          <p>
            Total:
            {" "}
            $
            {
              order.total_amount
            }
          </p>

          <p>
            Status:
            {" "}
            {order.status}
          </p>

          <div className="flex gap-4 mt-4">
            <Link
              to={`/admin/orders/edit/${order.id}`}
              className="bg-yellow-500 text-white px-4 py-2 rounded"
            >
              Edit
            </Link>

            <button
              onClick={() =>
                handleDelete(
                  order.id
                )
              }
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminOrders;