import axiosClient from './axiosClient';

const endpoint = '/users';

export const staffAPI = {
  getStaffs: async () => {
    const res = await axiosClient.get(`${endpoint}/staff`);
    return res.data;
  },
  createStaff: async (payload: { name: string; email: string; password: string; role?: string; shop_id?: number }) => {
    const res = await axiosClient.post(`${endpoint}`, payload);
    return res.data;
  },
  updateStaff: async (id: number, payload: { name?: string; email?: string; role?: string }) => {
    const res = await axiosClient.put(`${endpoint}/${id}`, payload);
    return res.data;
  },
  deleteStaff: async (id: number) => {
    const res = await axiosClient.delete(`${endpoint}/${id}`);
    return res.data;
  },
};

export default staffAPI;
