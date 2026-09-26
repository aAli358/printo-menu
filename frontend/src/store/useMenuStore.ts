import { create } from 'zustand';
import type { Restaurant, MenuItem, Variant, Addon } from '../types';
import { detectLanguage, applyDocumentLanguage, type Lang } from '../utils/locale';
import {
  type MenuThemeId,
  DEFAULT_THEME_ID,
  getThemeById,
  applyThemeToDocument,
} from '../themes';

interface CartItem {
  id: string;
  menuItem: MenuItem;
  selectedVariant: Variant | null;
  selectedAddons: Addon[];
  quantity: number;
  totalPrice: number;
}

interface MenuState {
  restaurant: Restaurant | null;
  loading: boolean;
  error: string | null;
  cart: CartItem[];
  cartTotal: number;
  colorMode: 'light' | 'dark';
  menuThemeId: MenuThemeId;
  language: Lang;
  tableNumber: string | null;
  accessSource: 'qr' | 'nfc' | 'direct' | null;

  setRestaurant: (restaurant: Restaurant) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTableNumber: (table: string | null) => void;
  setAccessSource: (source: 'qr' | 'nfc' | 'direct' | null) => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  toggleColorMode: () => void;
  setMenuTheme: (themeId: MenuThemeId) => void;
  setLanguage: (lang: Lang) => void;
  applyBranding: (restaurant: Restaurant) => void;
  clearCart: () => void;
}

const applyCurrentTheme = (themeId: MenuThemeId, colorMode: 'light' | 'dark') => {
  const theme = getThemeById(themeId);
  applyThemeToDocument(theme, colorMode);
};

export const useMenuStore = create<MenuState>((set) => ({
  restaurant: null,
  loading: false,
  error: null,
  cart: [],
  cartTotal: 0,
  colorMode: 'light',
  menuThemeId: DEFAULT_THEME_ID,
  language: detectLanguage(),
  tableNumber: null,
  accessSource: null,

  setRestaurant: (restaurant) => set({ restaurant }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setTableNumber: (tableNumber) => set({ tableNumber }),
  setAccessSource: (accessSource) => set({ accessSource }),

  applyBranding: (restaurant) => {
    const themeId = (restaurant.menu_theme ?? DEFAULT_THEME_ID) as MenuThemeId;
    const colorMode = restaurant.theme_mode === 'dark' ? 'dark' : 'light';

    applyCurrentTheme(themeId, colorMode);

    if (restaurant.primary_color) {
      document.documentElement.style.setProperty('--color-primary', restaurant.primary_color);
      document.documentElement.style.setProperty('--color-primary-glow', `${restaurant.primary_color}55`);
    }
    if (restaurant.secondary_color) {
      document.documentElement.style.setProperty('--color-secondary', restaurant.secondary_color);
    }
    if (restaurant.font_family) {
      document.documentElement.style.setProperty('--font-brand', `'${restaurant.font_family}', sans-serif`);
    }

    set({ menuThemeId: themeId, colorMode });
  },

  setMenuTheme: (themeId) => {
    const theme = getThemeById(themeId);
    const colorMode = theme.mode;

    applyCurrentTheme(themeId, colorMode);
    set({ menuThemeId: themeId, colorMode });
  },

  addToCart: (item) => set((state) => {
    const newCart = [...state.cart, item];
    return { cart: newCart, cartTotal: newCart.reduce((sum, i) => sum + i.totalPrice, 0) };
  }),

  removeFromCart: (cartItemId) => set((state) => {
    const newCart = state.cart.filter((i) => i.id !== cartItemId);
    return { cart: newCart, cartTotal: newCart.reduce((sum, i) => sum + i.totalPrice, 0) };
  }),

  updateQuantity: (cartItemId, delta) => set((state) => {
    const newCart = state.cart.map((item) =>
      item.id === cartItemId
        ? { ...item, quantity: Math.max(1, item.quantity + delta), totalPrice: (item.totalPrice / item.quantity) * Math.max(1, item.quantity + delta) }
        : item
    );
    return { cart: newCart, cartTotal: newCart.reduce((sum, i) => sum + i.totalPrice, 0) };
  }),

  toggleColorMode: () => set((state) => {
    const colorMode = state.colorMode === 'light' ? 'dark' : 'light';
    applyCurrentTheme(state.menuThemeId, colorMode);
    return { colorMode };
  }),

  setLanguage: (lang) => {
    localStorage.setItem('emenu-lang', lang);
    applyDocumentLanguage(lang);
    set({ language: lang });
  },

  clearCart: () => set({ cart: [], cartTotal: 0 }),
}));
