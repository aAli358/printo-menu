import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  is_superuser?: boolean;
}

export interface AuthRestaurant {
  id: number;
  name: string;
  name_en: string;
  slug: string;
  logo: string | null;
  subscription_status: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  restaurants: AuthRestaurant[];
  setSession: (payload: {
    access: string;
    refresh: string;
    user: AuthUser;
    restaurants?: AuthRestaurant[];
  }) => void;
  setRestaurants: (restaurants: AuthRestaurant[]) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      restaurants: [],

      setSession: ({ access, refresh, user, restaurants = [] }) =>
        set({ accessToken: access, refreshToken: refresh, user, restaurants }),

      setRestaurants: (restaurants) => set({ restaurants }),

      logout: () => set({ accessToken: null, refreshToken: null, user: null, restaurants: [] }),

      isAuthenticated: () => Boolean(get().accessToken),
    }),
    { name: 'emenu-auth' },
  ),
);
