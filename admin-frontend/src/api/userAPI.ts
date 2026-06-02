import axiosClient from './axiosClient';

const endpoint = '/users';

export const userAPI = {
  getStaffs: async () => {
    const res = await axiosClient.get(`${endpoint}/staff`);
    return res.data;
  },
  createStaff: async (payload: { name: string; email: string; password: string; role?: string; shop_id: number }) => {
    const res = await axiosClient.post(`${endpoint}`, payload);
    return res.data;
  },
  deleteUser: async (id: number) => {
    const res = await axiosClient.delete(`${endpoint}/${id}`);
    return res.data;
  },
};

export default userAPI;
