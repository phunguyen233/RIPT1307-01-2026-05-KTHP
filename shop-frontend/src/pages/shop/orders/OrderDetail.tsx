import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import orderAPI from "../../../api/orderAPI";

const OrderDetail = () => {
  const { id } =
    useParams();

  const [order, setOrder] =
    useState<any>(null);

  const fetchOrder =
    async () => {
      try {
        const data =
          await orderAPI.getOrderDetail(
            Number(id)
          );

        setOrder(data.data);
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    fetchOrder();
  }, []);

  if (!order) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Order Detail
      </h1>

      <div className="border p-4 rounded">
        <p>
          Customer:
          {" "}
          {order.customer_name}
        </p>

        <p>
          Phone:
          {" "}
          {order.phone}
        </p>

        <p>
          Address:
          {" "}
          {order.address}
        </p>

        <p>
          Total:
          {" "}
          $
          {order.total_amount}
        </p>
      </div>
    </div>
  );
};

export default OrderDetail;