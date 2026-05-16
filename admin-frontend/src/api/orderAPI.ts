import axiosClient from "./axiosClient";

const endpoint = "/orders";

export const orderAPI = {
  // Get all orders
  getOrders: async () => {
    const res = await axiosClient.get(
      endpoint
    );

    return res.data;
  },

  // Get order by id
  getOrderById: async (id: number) => {
    const res = await axiosClient.get(
      `${endpoint}/${id}`
    );

    return res.data;
  },

  // Create order
  createOrder: async (payload: {
    customerName: string;

    phone: string;

    address: string;

    status: string;

    totalAmount: number;
  }) => {
    const res = await axiosClient.post(
      endpoint,
      payload
    );

    return res.data;
  },

  // Update order
  updateOrder: async (
    id: number,

    payload: {
      customerName: string;

      phone: string;

      address: string;

      status: string;

      totalAmount: number;
    }
  ) => {
    const res = await axiosClient.put(
      `${endpoint}/${id}`,
      payload
    );

    return res.data;
  },

  // Delete order
  deleteOrder: async (id: number) => {
    const res = await axiosClient.delete(
      `${endpoint}/${id}`
    );

    return res.data;
  },
};

export default orderAPI;