import axiosClient from "./axiosClient";

const endpoint = "/inventory-imports";

export const inventoryImportAPI = {
  getAll: async (): Promise<any[]> => {
    const res = await axiosClient.get(endpoint);
    return res.data;
  },

  getById: async (id: number): Promise<any> => {
    const res = await axiosClient.get(`${endpoint}/${id}`);
    return res.data;
  },

  create: async (payload: any): Promise<any> => {
    const res = await axiosClient.post(endpoint, payload);
    return res.data;
  },

  update: async (id: number, payload: any): Promise<any> => {
    const res = await axiosClient.put(`${endpoint}/${id}`, payload);
    return res.data;
  },

  delete: async (id: number): Promise<any> => {
    const res = await axiosClient.delete(`${endpoint}/${id}`);
    return res.data;
  },
};

export default inventoryImportAPI;
