import axiosClient from "./axiosClient";

const endpoint = "/customers";

export const customerAPI = {
  // Backwards-compatible name used across pages
  getCustomers: async () => {
    const res = await axiosClient.get(endpoint);
    return res.data;
  },

  // Common API names expected by pages
  getAll: async () => {
    return await (customerAPI.getCustomers() as Promise<any>);
  },

  create: async (payload: any) => {
    const res = await axiosClient.post(endpoint, payload);
    return res.data;
  },

  update: async (id: number, payload: any) => {
    const res = await axiosClient.put(`${endpoint}/${id}`, payload);
    return res.data;
  },

  delete: async (id: number) => {
    const res = await axiosClient.delete(`${endpoint}/${id}`);
    return res.data;
  },
};

export default customerAPI;