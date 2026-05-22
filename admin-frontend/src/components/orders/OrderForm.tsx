import { useState } from "react";

interface Props {
  initialData?: any;

  onSubmit: (data: any) => void;
}

const OrderForm = ({
  initialData,
  onSubmit,
}: Props) => {
  const [formData, setFormData] =
    useState({
      customerName:
        initialData?.customerName ||
        "",

      phone:
        initialData?.phone || "",

      address:
        initialData?.address || "",

      status:
        initialData?.status ||
        "pending",

      totalAmount:
        initialData?.totalAmount || 0,
    });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <input
        type="text"
        name="customerName"
        placeholder="Customer Name"
        value={formData.customerName}
        onChange={handleChange}
        className="border p-2 w-full"
      />

      <input
        type="text"
        name="phone"
        placeholder="Phone"
        value={formData.phone}
        onChange={handleChange}
        className="border p-2 w-full"
      />

      <input
        type="text"
        name="address"
        placeholder="Address"
        value={formData.address}
        onChange={handleChange}
        className="border p-2 w-full"
      />

      <input
        type="text"
        name="status"
        placeholder="Status"
        value={formData.status}
        onChange={handleChange}
        className="border p-2 w-full"
      />

      <input
        type="number"
        name="totalAmount"
        placeholder="Total Amount"
        value={formData.totalAmount}
        onChange={handleChange}
        className="border p-2 w-full"
      />

      <button className="bg-black text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
};

export default OrderForm;