import { useNavigate } from "react-router-dom";

import OrderForm from "../../../components/orders/OrderForm";

import orderAPI from "../../../api/orderAPI";

const CreateOrder = () => {
  const navigate = useNavigate();

  const handleCreate = async (
    data: any
  ) => {
    try {
      await orderAPI.createOrder(data);

      navigate("/admin/orders");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Create Order
      </h1>

      <OrderForm
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default CreateOrder;