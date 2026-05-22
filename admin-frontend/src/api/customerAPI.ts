import axiosClient from "./axiosClient";

const endpoint = "/customers";

export const customerAPI = {
  getCustomers: async () => {
    const res = await axiosClient.get(
      endpoint
    );

    return res.data;
  },
};

export default customerAPI;