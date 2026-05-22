import shopApiClient from "./shopApiClient";

const endpoint = "/orders";

export const orderAPI = {
  getMyOrders: async () => {
    const res =
      await shopApiClient.get(
        `${endpoint}/my-orders`
      );

    return res.data;
  },

  getOrderDetail: async (
    id: number
  ) => {
    const res =
      await shopApiClient.get(
        `${endpoint}/${id}`
      );

    return res.data;
  },
};

export default orderAPI;