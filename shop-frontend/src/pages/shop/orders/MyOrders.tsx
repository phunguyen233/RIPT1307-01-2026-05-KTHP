import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import orderAPI from "../../../api/orderAPI";

const MyOrders = () => {
  const [orders, setOrders] =
    useState<any[]>([]);

  const fetchOrders =
    async () => {
      try {
        const data =
          await orderAPI.getMyOrders();

        setOrders(data.data);
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        My Orders
      </h1>

      {orders.map((order) => (
        <div
          key={order.id}
          className="border p-4 rounded mb-4"
        >
          <p>
            Order #
            {order.id}
          </p>

          <p>
            Status:
            {" "}
            {order.status}
          </p>

          <p>
            Total:
            {" "}
            $
            {order.total_amount}
          </p>

          <Link
            to={`/orders/${order.id}`}
            className="text-blue-500"
          >
            View Detail
          </Link>
        </div>
      ))}
    </div>
  );
};

export default MyOrders;