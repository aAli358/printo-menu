import client from './client';

export type PromoType = 'happy_hour' | 'category_discount' | 'buy_x_get_y' | 'coupon';

export interface Promotion {
  id: number;
  name: string;
  promo_type: PromoType;
  discount_percent: string | null;
  discount_amount: string | null;
  category: number | null;
  category_name?: string;
  buy_quantity: number | null;
  get_quantity: number | null;
  coupon_code: string;
  start_time: string | null;
  end_time: string | null;
  days_of_week: number[];
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
}

export const fetchPromotions = async () => {
  const { data } = await client.get<Promotion[]>('promotions/');
  return data;
};

export const createPromotion = async (payload: Partial<Promotion>) => {
  const { data } = await client.post<Promotion>('promotions/', payload);
  return data;
};

export const updatePromotion = async (id: number, payload: Partial<Promotion>) => {
  const { data } = await client.patch<Promotion>(`promotions/${id}/`, payload);
  return data;
};

export const deletePromotion = async (id: number) => {
  await client.delete(`promotions/${id}/`);
};

export const fetchActivePromotions = async () => {
  const { data } = await client.get<Promotion[]>('promotions/active/');
  return data;
};
