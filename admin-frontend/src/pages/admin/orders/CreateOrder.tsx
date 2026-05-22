import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import adminOrderAPI from "../../../api/adminOrderAPI";

const CreateOrder = () => {
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
        await adminOrderAPI.createOrder(
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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Create Order
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
          placeholder="Customer Name"
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
          placeholder="Total Amount"
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
          placeholder="Status"
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
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </form>
    </div>
  );
};

export default CreateOrder;