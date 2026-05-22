import axiosClient from "./axiosClient";
import { Order as OrderType } from "../types/order";

const endpoint = "/orders";

export const adminOrderAPI = {
  getOrders: async (): Promise<any[]> => {
    const res = await axiosClient.get(endpoint);
    return res.data;
  },

  getAll: async (): Promise<any[]> => {
    return await adminOrderAPI.getOrders();
  },

  getById: async (id: number): Promise<any> => {
    const res = await axiosClient.get(`${endpoint}/${id}`);
    return res.data;
  },

  create: async (payload: any): Promise<any> => {
    const res = await axiosClient.post(endpoint, payload);
    return res.data;
  },

  createOrder: async (payload: any): Promise<any> => {
    return await adminOrderAPI.create(payload);
  },

  updateOrder: async (id: number, payload: any): Promise<any> => {
    const res = await axiosClient.put(`${endpoint}/${id}`, payload);
    return res.data;
  },

  updateStatus: async (id: number, status: string): Promise<any> => {
    return await adminOrderAPI.updateOrder(id, { status });
  },

  delete: async (id: number): Promise<any> => {
    const res = await axiosClient.delete(`${endpoint}/${id}`);
    return res.data;
  },

  search: async (query: string): Promise<any[]> => {
    const all = await adminOrderAPI.getOrders();
    if (!query || !query.trim()) return all;
    const normalized = query.trim().toLowerCase();
    return all.filter((order: any) => {
      return [
        order.order_code,
        order.customer_name,
        order.customer_phone,
        order.shipping_address,
        order.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  },
};

export type Order = OrderType;

// Provide a normalized named export `orderAPI` for pages that import it
export const orderAPI = adminOrderAPI;

export default orderAPI;