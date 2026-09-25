import client from '../api/client';
import { useAuthStore, type AuthRestaurant, type AuthUser } from '../store/useAuthStore';
import { buildSubdomainUrl, isRootDomain } from './tenant';

interface SessionPayload {
  access: string;
  refresh: string;
  user: AuthUser;
  restaurants: AuthRestaurant[];
}

function encodeSession(payload: SessionPayload): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeSession(encoded: string): SessionPayload | null {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded)))) as SessionPayload;
  } catch {
    return null;
  }
}

function appendQueryParam(url: string, key: string, value: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

/** Persist session on current origin and redirect to tenant subdomain. */
export async function redirectToTenantWithSession(
  slug: string,
  path: string,
  payload: SessionPayload,
): Promise<void> {
  useAuthStore.getState().setSession({
    access: payload.access,
    refresh: payload.refresh,
    user: payload.user,
    restaurants: payload.restaurants,
  });

  try {
    const { data } = await client.post<{ code: string }>('auth/handoff/', {
      access: payload.access,
      refresh: payload.refresh,
      user: payload.user,
      restaurants: payload.restaurants,
    });
    window.location.href = appendQueryParam(buildSubdomainUrl(slug, path), 'handoff', data.code);
    return;
  } catch {
    const hash = `#session=${encodeURIComponent(encodeSession(payload))}`;
    window.location.href = `${buildSubdomainUrl(slug, path)}${hash}`;
  }
}

/** After login/register: subdomain dashboard if on root, else local /dashboard. */
export async function redirectAfterAuth(
  restaurants: AuthRestaurant[],
  payload: SessionPayload,
): Promise<void> {
  const slug = restaurants[0]?.slug;
  if (isRootDomain() && slug) {
    await redirectToTenantWithSession(slug, '/dashboard', payload);
    return;
  }
  window.location.href = '/dashboard';
}

/** Exchange one-time handoff code from URL query (secure cross-subdomain login). */
export async function consumeHandoffFromQuery(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('handoff');
  if (!code) return false;

  try {
    const { data } = await client.post<SessionPayload>('auth/handoff/consume/', { code });
    if (!data?.access || !data?.refresh) return false;
    useAuthStore.getState().setSession({
      access: data.access,
      refresh: data.refresh,
      user: data.user,
      restaurants: data.restaurants ?? [],
    });
    params.delete('handoff');
    const qs = params.toString();
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
    return true;
  } catch {
    return false;
  }
}

/** Read one-time session token from URL hash (legacy fallback). */
export function consumeSessionFromHash(): boolean {
  const match = window.location.hash.match(/^#session=(.+)$/);
  if (!match) return false;
  const data = decodeSession(decodeURIComponent(match[1]));
  if (!data?.access || !data?.refresh) return false;
  useAuthStore.getState().setSession({
    access: data.access,
    refresh: data.refresh,
    user: data.user,
    restaurants: data.restaurants ?? [],
  });
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return true;
}

export function hasHandoffQuery(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('handoff');
}

export function needsAuthBootstrap(): boolean {
  return hasHandoffQuery() || (typeof window !== 'undefined' && window.location.hash.startsWith('#session='));
}
