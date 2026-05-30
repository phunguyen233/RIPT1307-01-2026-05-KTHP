import axiosClient from './axiosClient';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    shop_id: number | null;
    created_at: string;
  };
};

export const login = async (payload: LoginPayload) => {
  const response = await axiosClient.post<LoginResponse>('/users/login', payload);
  return response.data;
};
