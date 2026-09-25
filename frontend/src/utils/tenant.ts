const RESERVED = new Set([
  'www', 'admin', 'api', 'app', 'dashboard', 'kitchen', 'login', 'static', 'media',
]);

function isIpAddress(host: string): boolean {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  if (host.includes(':')) return true;
  return false;
}

/**
 * Extract tenant slug from current hostname.
 * e.g. shams.localhost -> shams, shams.emenu.com -> shams
 */
export function getSubdomainSlug(): string | null {
  const host = window.location.hostname.toLowerCase();
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  if (isIpAddress(host)) return null;

  const parts = host.split('.');
  if (parts.length < 2) return null;

  const slug = parts[0];
  if (RESERVED.has(slug)) return null;

  const tld = parts[parts.length - 1];
  if (tld === 'localhost' || tld === 'local' || tld === 'test') return slug;
  if (parts.length >= 3) return slug;

  return null;
}

function parseSearch(search: string): URLSearchParams {
  const raw = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(raw);
}

function appendSearch(base: string, search: string): string {
  const params = parseSearch(search);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Build tenant subdomain URL for menu preview. */
export function buildSubdomainUrl(slug: string, path = '/', search = ''): string {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname.toLowerCase();
  const origin = window.location.origin;
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN as string | undefined;

  // Mobile / LAN via IP — wildcard subdomains don't work; use /r/:slug on same host
  if (isIpAddress(hostname)) {
    return appendSearch(`${origin}/r/${slug}`, search);
  }

  if (baseDomain) {
    let host: string;
    if (baseDomain.includes(':')) {
      const [domain, port] = baseDomain.split(':');
      host = `${slug}.${domain}:${port}`;
    } else {
      host = `${slug}.${baseDomain}`;
    }
    return `${protocol}//${host}${path}${search}`;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port || '5173';
    const host = `${slug}.localhost:${port}`;
    return `${protocol}//${host}${path}${search}`;
  }

  const baseParts = hostname.split('.').slice(1);
  const host = baseParts.length
    ? `${slug}.${baseParts.join('.')}${window.location.port ? `:${window.location.port}` : ''}`
    : `${slug}.${hostname}${window.location.port ? `:${window.location.port}` : ''}`;

  return `${protocol}//${host}${path}${search}`;
}

/** Legacy menu URL — works on platform root when subdomains are unavailable. */
export function buildLegacyMenuUrl(slug: string, table?: string): string {
  const params = new URLSearchParams();
  if (table) params.set('table', table);
  const qs = params.toString();
  const host = window.location.hostname.toLowerCase();

  if (isRootDomain() || isIpAddress(host)) {
    return qs
      ? `${window.location.origin}/r/${slug}?${qs}`
      : `${window.location.origin}/r/${slug}`;
  }

  params.set('r', slug);
  return `${window.location.origin}/?${params.toString()}`;
}

export function getTenantSlugFromContext(querySlug?: string | null): string | null {
  return getSubdomainSlug() || querySlug || null;
}

/** Resolve tenant slug from path (/r/shams), query (?r=shams), or subdomain. */
export function getTenantSlugFromUrl(): string | null {
  const fromSub = getSubdomainSlug();
  if (fromSub) return fromSub;

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('r');
  if (fromQuery) return fromQuery;

  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'r' && parts[1]) return parts[1];

  return null;
}

/** True when browsing the platform root (no tenant subdomain). */
export function isRootDomain(): boolean {
  return getSubdomainSlug() === null;
}

/** Platform admin URLs must live on the root host, not tenant subdomains. */
export function buildRootOriginUrl(path = '/'): string {
  const protocol = window.location.protocol;
  const port = window.location.port;
  const portSuffix = port ? `:${port}` : '';
  const hostname = window.location.hostname.toLowerCase();
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN as string | undefined;

  if (isIpAddress(hostname)) {
    return `${protocol}//${hostname}${portSuffix}${path}`;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//localhost${portSuffix}${path}`;
  }

  if (getSubdomainSlug()) {
    if (hostname.endsWith('.localhost')) {
      return `${protocol}//localhost${portSuffix}${path}`;
    }
    if (baseDomain) {
      const host = baseDomain.includes(':') ? baseDomain : `${baseDomain}${portSuffix}`;
      return `${protocol}//${host}${path}`;
    }
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const rootHost = `${parts.slice(1).join('.')}${portSuffix}`;
      return `${protocol}//${rootHost}${path}`;
    }
  }

  return `${window.location.origin}${path}`;
}
