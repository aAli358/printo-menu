import client from './client';
import type { PlatformBranding } from '../types';

export const getPlatformBranding = async (): Promise<PlatformBranding> => {
  const { data } = await client.get<PlatformBranding>('platform/branding/');
  return data;
};

export interface PlatformRestaurant {
  id: number;
  name: string;
  slug: string;
  owner_username: string;
  is_active: boolean;
  subscription_status: string;
  subscription_plan: string;
  subscription_expires_at: string | null;
  custom_domain: string | null;
  landing_theme: string;
  hide_platform_branding: boolean;
  latitude: number | null;
  longitude: number | null;
  phone: string;
}

export interface PlatformStats {
  total_restaurants: number;
  active_restaurants: number;
  trial_restaurants: number;
  suspended_restaurants: number;
  mrr_estimate_iqd: number;
  monthly_revenue_platform: number;
  monthly_orders: number;
  restaurants_map: PlatformRestaurant[];
}

export const fetchPlatformStats = async () => {
  const { data } = await client.get<PlatformStats>('platform/stats/');
  return data;
};

export const patchPlatformRestaurant = async (
  id: number,
  payload: Partial<PlatformRestaurant> & { extend_days?: number },
) => {
  const { data } = await client.patch<PlatformRestaurant>(`platform/restaurants/${id}/`, payload);
  return data;
};

export const patchPlatformSubscription = async (
  id: number,
  payload: {
    subscription_status?: string;
    subscription_plan?: string;
    extend_days?: number;
    is_active?: boolean;
  },
) => {
  const { data } = await client.patch<PlatformRestaurant>(`platform/restaurants/${id}/subscription/`, payload);
  return data;
};
