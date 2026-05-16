export interface Order {
  id?: number;

  customerName: string;

  phone: string;

  address: string;

  status: string;

  totalAmount: number;

  created_at?: string;
}