import axiosClient from "./axiosClient";

const endpoint = "/cart";

export const cartAPI = {
  getCart: async () => {
    const res = await axiosClient.get(
      endpoint
    );

    return res.data;
  },

  addToCart: async (
    payload: any
  ) => {
    const res = await axiosClient.post(
      endpoint,
      payload
    );

    return res.data;
  },

  removeCartItem: async (
    id: number
  ) => {
    const res =
      await axiosClient.delete(
        `${endpoint}/${id}`
      );

    return res.data;
  },
};

export default cartAPI;