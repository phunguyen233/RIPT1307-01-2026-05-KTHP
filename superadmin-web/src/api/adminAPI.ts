import axiosClient from './axiosClient';

export type DashboardStats = {
  total_shops: number;
  total_customers: number;
  total_products: number;
  total_orders: number;
};

export type ShopStats = {
  id: number;
  name: string;
  email: string | null;
  created_at: string;
  customer_count: number;
  product_count: number;
  order_count: number;
  revenue: number;
};

export type AdminUserStats = {
  id: number;
  name: string;
  email: string;
  role: string;
  shop_id: number | null;
  customer_count: number;
};

export const getDashboardStats = async () => {
  const response = await axiosClient.get<DashboardStats>('/admin/dashboard');
  return response.data;
};

export const getShopsStats = async () => {
  const response = await axiosClient.get<ShopStats[]>('/admin/shops');
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await axiosClient.get<AdminUserStats[]>('/admin/admin-users');
  return response.data;
};
