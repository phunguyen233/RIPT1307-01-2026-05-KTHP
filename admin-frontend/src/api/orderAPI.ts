import axiosClient from "./axiosClient";

const endpoint = "/orders";

export const orderAPI = {
  getMyOrders: async () => {
    const res = await axiosClient.get(
      `${endpoint}/my-orders`
    );

    return res.data;
  },

  getOrderDetail: async (
    id: number
  ) => {
    const res = await axiosClient.get(
      `${endpoint}/${id}`
    );

    return res.data;
  },
};

export default orderAPI;