import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import orderAPI from "../../../api/orderAPI";

const OrderDetail = () => {
  const { id } = useParams();

  const [order, setOrder] =
    useState<any>(null);

  const fetchOrder = async () => {
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
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Order Detail
      </h1>

      <div className="border rounded p-6 shadow">
        <p>
          <strong>ID:</strong>
          {" "}
          {order.id}
        </p>

        <p>
          <strong>
            Customer:
          </strong>
          {" "}
          {order.customer_name}
        </p>

        <p>
          <strong>
            Phone:
          </strong>
          {" "}
          {order.phone}
        </p>

        <p>
          <strong>
            Address:
          </strong>
          {" "}
          {order.address}
        </p>

        <p>
          <strong>
            Status:
          </strong>
          {" "}
          {order.status}
        </p>

        <p>
          <strong>
            Total:
          </strong>
          {" "}
          $
          {order.total_amount}
        </p>
      </div>
    </div>
  );
};

export default OrderDetail;