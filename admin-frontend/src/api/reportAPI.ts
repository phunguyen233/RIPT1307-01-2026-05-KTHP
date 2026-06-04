import axiosClient from './axiosClient';

const endpoint = '/reports';

export const reportAPI = {
  getReport: async (reportKey: string, params: Record<string, any>) => {
    const res = await axiosClient.get(`${endpoint}/${reportKey}`, { params });
    return res.data;
  },
};

export default reportAPI;
