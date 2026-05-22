export interface Order {
  id?: number;
  order_code?: string;
  customer_id?: number;
  customer_name?: string;
  customer_phone?: string;
  shipping_address?: string;
  total_price?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  created_at?: string;
  order_items?: Array<{
    id?: number;
    product_id?: number;
    product_name?: string;
    quantity: number;
    price: number;
  }>;
}