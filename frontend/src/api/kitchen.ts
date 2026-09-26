import client from './client';

export interface KitchenOrderItem {
  id: number;
  menu_item_name: string;
  quantity: number;
  price: string;
  modifiers_text: string;
}

export interface KitchenOrder {
  id: number;
  table_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: KitchenOrderItem[];
}

export interface KitchenTableCall {
  id: number;
  table_number: string;
  call_type: 'waiter' | 'bill' | 'other';
  access_source: string;
  is_resolved: boolean;
  created_at: string;
}

export type OrderStatusFilter = 'all' | 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export const fetchKitchenOrders = async (status: OrderStatusFilter = 'all') => {
  const params = status !== 'all' ? { status } : {};
  const { data } = await client.get<KitchenOrder[]>('orders/kitchen/', { params });
  return data;
};

export const fetchPendingTableCalls = async () => {
  const { data } = await client.get<KitchenTableCall[]>('table-calls/pending/');
  return data;
};

export const updateOrderStatus = async (orderId: number, status: string) => {
  const { data } = await client.post<{
    status: string;
    whatsapp_customer_link?: string | null;
  }>(`orders/${orderId}/update_status/`, { status });
  return data;
};

export const resolveTableCall = async (callId: number) => {
  const { data } = await client.post(`table-calls/${callId}/resolve/`);
  return data;
};
