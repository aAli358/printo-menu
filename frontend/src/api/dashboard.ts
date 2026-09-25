import client from './client';
import type { Restaurant, Category, MenuItem } from '../types';

export const fetchMyRestaurant = async () => {
  const { data } = await client.get<Restaurant>('restaurants/my/');
  return data;
};

export const updateBranding = async (slug: string, payload: FormData | Record<string, unknown>) => {
  const { data } = await client.patch<Restaurant>(`restaurants/${slug}/branding/`, payload);
  return data;
};

export const clearRestaurantMenu = async (slug: string, confirm: string) => {
  const { data } = await client.post<{ deleted_categories: number; deleted_items: number }>(
    `restaurants/${slug}/clear-menu/`,
    { confirm },
  );
  return data;
};

export interface CategoryInput {
  name: string;
  name_en?: string;
  order?: number;
  is_active?: boolean;
}

export const fetchCategories = async () => {
  const { data } = await client.get<Category[]>('categories/');
  return data;
};

export const createCategory = async (payload: CategoryInput) => {
  const { data } = await client.post('categories/', payload);
  return data;
};

export const updateCategory = async (id: number, payload: Partial<CategoryInput>) => {
  const { data } = await client.patch(`categories/${id}/`, payload);
  return data;
};

export const reorderCategories = async (items: Array<{ id: number; order: number }>) => {
  await client.post('categories/reorder/', { items });
};

export const reorderMenuItems = async (items: Array<{ id: number; order: number }>) => {
  await client.post('items/reorder/', { items });
};

export const deleteCategory = async (id: number) => {
  await client.delete(`categories/${id}/`);
};

export interface MenuItemInput {
  category: number;
  name: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  base_price: string | number;
  is_available?: boolean;
  tags?: string[];
  order?: number;
}

export const createMenuItem = async (payload: MenuItemInput | FormData) => {
  const { data } = await client.post<MenuItem>('items/', payload);
  return data;
};

export const updateMenuItem = async (id: number, payload: Partial<MenuItemInput> | FormData) => {
  const { data } = await client.patch<MenuItem>(`items/${id}/`, payload);
  return data;
};

export const deleteMenuItem = async (id: number) => {
  await client.delete(`items/${id}/`);
};

export const toggleItemStock = async (id: number) => {
  const { data } = await client.post(`items/${id}/toggle_stock/`);
  return data as { is_available: boolean };
};

export interface RestaurantTableRow {
  id: number;
  number: string;
  label: string;
  is_active: boolean;
  menu_url: string;
  qr_png_url: string;
}

export const fetchTables = async () => {
  const { data } = await client.get<RestaurantTableRow[]>('tables/');
  return data;
};

export const createTable = async (number: string, label = '') => {
  const { data } = await client.post<RestaurantTableRow>('tables/', { number, label, is_active: true });
  return data;
};

export const deleteTable = async (id: number) => {
  await client.delete(`tables/${id}/`);
};

export const bulkGenerateTables = async (count: number) => {
  const { data } = await client.post<{ created: number; tables: RestaurantTableRow[] }>('tables/bulk-generate/', { count });
  return data;
};

export const downloadTableQr = async (tableId: number, format: 'png' | 'svg' = 'png') => {
  const response = await client.get(`tables/${tableId}/qr/?ext=${format}`, { responseType: 'blob' });
  return response.data as Blob;
};

export const downloadGeneralQr = async (slug: string) => {
  const response = await client.get(`restaurants/${slug}/qr-general/`, { responseType: 'blob' });
  return response.data as Blob;
};

export const downloadGeneralBarcode = async (slug: string) => {
  const response = await client.get(`restaurants/${slug}/barcode-general/`, { responseType: 'blob' });
  return response.data as Blob;
};

export const downloadTableBarcode = async (tableId: number) => {
  const response = await client.get(`tables/${tableId}/barcode/`, { responseType: 'blob' });
  return response.data as Blob;
};

export const downloadTablesPdf = async (slug: string, tables = 20) => {
  const response = await client.get(`restaurants/${slug}/download_qrs/?tables=${tables}`, { responseType: 'blob' });
  return response.data as Blob;
};

export const createVariant = async (payload: { menu_item: number; name: string; price: string | number; name_en?: string }) => {
  const { data } = await client.post('variants/', payload);
  return data;
};

export const deleteVariant = async (id: number) => {
  await client.delete(`variants/${id}/`);
};

export const createAddonGroup = async (payload: {
  menu_item: number;
  name: string;
  min_selection?: number;
  max_selection?: number;
  addons?: Array<{ name: string; price: string | number }>;
}) => {
  const { data } = await client.post('addon-groups/', payload);
  return data;
};

export const deleteAddonGroup = async (id: number) => {
  await client.delete(`addon-groups/${id}/`);
};
