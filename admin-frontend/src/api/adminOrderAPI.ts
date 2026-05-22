import axiosClient from "./axiosClient";

const endpoint = "/orders";

export const adminOrderAPI = {
  getOrders: async () => {
    const res =
      await axiosClient.get(
        endpoint
      );

    return res.data;
  },

  createOrder: async (
    payload: any
  ) => {
    const res =
      await axiosClient.post(
        endpoint,
        payload
      );

    return res.data;
  },

  updateOrder: async (
    id: number,
    payload: any
  ) => {
    const res =
      await axiosClient.put(
        `${endpoint}/${id}`,
        payload
      );

    return res.data;
  },

  deleteOrder: async (
    id: number
  ) => {
    const res =
      await axiosClient.delete(
        `${endpoint}/${id}`
      );

    return res.data;
  },
};

export default adminOrderAPI;