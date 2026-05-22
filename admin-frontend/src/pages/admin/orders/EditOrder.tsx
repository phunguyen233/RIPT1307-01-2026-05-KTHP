import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import adminOrderAPI from "../../../api/adminOrderAPI";

const EditOrder = () => {
  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      customer_name: "",

      total_amount: "",

      status: "",
    });

  const handleChange = (
    e: any
  ) => {
    setForm({
      ...form,

      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit =
    async (e: any) => {
      e.preventDefault();

      try {
        await adminOrderAPI.updateOrder(
          Number(id),

          {
            ...form,

            total_amount:
              Number(
                form.total_amount
              ),
          }
        );

        navigate(
          "/admin/orders"
        );
      } catch (error) {
        console.log(error);
      }
    };

  useEffect(() => {
    // fake load
    setForm({
      customer_name:
        "John Doe",

      total_amount:
        "500",

      status:
        "pending",
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Edit Order
      </h1>

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-4"
      >
        <input
          type="text"
          name="customer_name"
          value={
            form.customer_name
          }
          onChange={
            handleChange
          }
          className="border p-2 w-full"
        />

        <input
          type="number"
          name="total_amount"
          value={
            form.total_amount
          }
          onChange={
            handleChange
          }
          className="border p-2 w-full"
        />

        <input
          type="text"
          name="status"
          value={
            form.status
          }
          onChange={
            handleChange
          }
          className="border p-2 w-full"
        />

        <button
          type="submit"
          className="bg-yellow-500 text-white px-4 py-2 rounded"
        >
          Update
        </button>
      </form>
    </div>
  );
};

export default EditOrder;