export interface PlatformBranding {
  show: boolean;
  name: string;
  logo_url: string;
  website_url: string;
}

export interface Restaurant {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  logo: string | null;
  cover_image: string | null;
  description: string;
  description_en: string;
  phone: string;
  whatsapp_number?: string;
  notification_email?: string | null;
  address: string;
  currency_code: string;
  primary_color: string;
  secondary_color: string;
  access_mode: 'table_specific' | 'general';
  font_family: string;
  theme_mode: 'light' | 'dark';
  menu_theme: string;
  qr_code: string | null;
  qr_color: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_expires_at?: string | null;
  landing_theme?: string;
  custom_domain?: string | null;
  hide_platform_branding?: boolean;
  categories: Category[];
  opening_hours: OpeningHour[];
  platform_branding?: PlatformBranding | null;
}

export interface Category {
  id: number;
  name: string;
  name_en: string;
  icon: string | null;
  order: number;
  items: MenuItem[];
}

export interface MenuItem {
  id: number;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  image: string | null;
  base_price: string;
  is_available: boolean;
  stock_quantity?: number | null;
  low_stock_threshold?: number;
  tags: string[];
  variants: Variant[];
  addon_groups: AddonGroup[];
  average_rating: number;
}

export interface Variant {
  id: number;
  name: string;
  name_en: string;
  price: string;
}

export interface AddonGroup {
  id: number;
  name: string;
  name_en: string;
  min_selection: number;
  max_selection: number;
  addons: Addon[];
}

export interface Addon {
  id: number;
  name: string;
  name_en: string;
  price: string;
}

export interface OpeningHour {
  day: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}
