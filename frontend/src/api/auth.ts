import client from './client';
import { useAuthStore } from '../store/useAuthStore';

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = useAuthStore.getState().refreshToken;
      if (refresh) {
        try {
          const { data } = await client.post('auth/refresh/', { refresh });
          useAuthStore.getState().setSession({
            access: data.access,
            refresh,
            user: useAuthStore.getState().user!,
            restaurants: useAuthStore.getState().restaurants,
          });
          original.headers.Authorization = `Bearer ${data.access}`;
          return client(original);
        } catch {
          useAuthStore.getState().logout();
          redirectToLogin();
        }
      } else {
        useAuthStore.getState().logout();
        redirectToLogin();
      }
    }
    return Promise.reject(error);
  },
);

function redirectToLogin() {
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
  restaurant_name: string;
  restaurant_name_en?: string;
  phone?: string;
}

export const login = async (payload: LoginPayload) => {
  const { data } = await client.post('auth/login/', payload);
  return data as { access: string; refresh: string };
};

export const register = async (payload: RegisterPayload) => {
  const { data } = await client.post('auth/register/', payload);
  return data as {
    user: { id: number; username: string; email: string; is_superuser?: boolean };
    restaurant: {
      id: number;
      name: string;
      slug: string;
      subscription_status?: string;
      subscription_expires_at?: string | null;
      trial_days?: number;
    };
    tokens: { access: string; refresh: string };
  };
};

export const fetchMe = async () => {
  const { data } = await client.get('auth/me/');
  return data as {
    user: { id: number; username: string; email: string; is_superuser: boolean };
    restaurants: Array<{ id: number; name: string; name_en: string; slug: string; logo: string | null; subscription_status: string }>;
  };
};
