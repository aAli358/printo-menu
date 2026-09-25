import axios from 'axios';
import { getTenantSlugFromUrl } from '../utils/tenant';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1/';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const slug = getTenantSlugFromUrl();
  if (slug) {
    config.headers['X-Tenant-Slug'] = slug;
  }
  if (config.data instanceof FormData) {
    // Let the browser set multipart boundary (manual Content-Type breaks uploads).
    if (config.headers && 'Content-Type' in config.headers) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

export interface RestaurantSummary {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  logo: string | null;
}

export const getRestaurantsList = async (): Promise<RestaurantSummary[]> => {
  const response = await client.get('restaurants/');
  return response.data;
};

export const getRestaurantMenu = async (slug: string) => {
  const response = await client.get(`restaurants/${slug}/public_menu/`);
  return response.data;
};

export const resolveRestaurantSlug = async (rawSlug?: string | null): Promise<string | null> => {
  const fromUrl = getTenantSlugFromUrl();
  if (fromUrl) return fromUrl;

  const invalid = new Set(['', 'localhost', '5173', 'kitchen', 'restaurant-name', 'login', 'dashboard', 'admin']);
  if (rawSlug && !invalid.has(rawSlug)) return rawSlug;

  const list = await getRestaurantsList();
  if (list.length === 1) return list[0].slug;
  return null;
};

export default client;
