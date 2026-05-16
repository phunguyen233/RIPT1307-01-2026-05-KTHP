import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import orderAPI from "../../../api/orderAPI";

import OrderForm from "../../../components/orders/OrderForm";

const EditOrder = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const [order, setOrder] =
    useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data =
          await orderAPI.getOrderById(
            Number(id)
          );

        setOrder(data.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchOrder();
  }, [id]);

  const handleUpdate = async (
    data: any
  ) => {
    try {
      await orderAPI.updateOrder(
        Number(id),
        data
      );

      navigate("/admin/orders");
    } catch (error) {
      console.log(error);
    }
  };

  if (!order) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Edit Order
      </h1>

      <OrderForm
        initialData={order}
        onSubmit={handleUpdate}
      />
    </div>
  );
};

export default EditOrder;