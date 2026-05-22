import {
  useEffect,
  useState,
} from "react";

import orderAPI from "../../../api/orderAPI";

const MyOrders = () => {
  const [orders, setOrders] =
    useState<any[]>([]);

  const fetchOrders = async () => {
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
      <h1 className="text-2xl font-bold mb-4">
        My Orders
      </h1>

      {orders.map((order) => (
        <div
          key={order.id}
          className="border p-4 mb-4 rounded"
        >
          <h2>
            Order #{order.id}
          </h2>

          <p>
            Status: {order.status}
          </p>

          <p>
            Total: {order.total_amount}
          </p>
        </div>
      ))}
    </div>
  );
};

export default MyOrders;