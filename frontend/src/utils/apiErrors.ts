/** Extract human-readable message from DRF global exception wrapper or raw errors. */
export function parseApiError(err: unknown, fallback: string): string {
  const ax = err as {
    response?: {
      data?: {
        message?: string;
        detail?: string;
        errors?: { detail?: string; username?: string[]; [key: string]: unknown };
        username?: string[];
      };
    };
  };
  const d = ax.response?.data;
  if (!d) return fallback;

  const fieldLabels: Record<string, string> = {
    base_price: 'السعر',
    name: 'الاسم',
    category: 'القسم',
    image: 'الصورة',
    tenant: 'المطعم',
  };

  const errors = d.errors as Record<string, unknown> | undefined;
  if (errors && typeof errors === 'object') {
    for (const [key, val] of Object.entries(errors)) {
      const label = fieldLabels[key] || key;
      if (Array.isArray(val) && val[0]) return `${label}: ${String(val[0])}`;
      if (typeof val === 'string') return `${label}: ${val}`;
    }
  }

  if (typeof d.message === 'string' && d.message !== 'An error occurred during processing.') {
    return d.message;
  }
  if (typeof d.detail === 'string') return d.detail;
  if (typeof d.errors?.detail === 'string') return d.errors.detail;
  if (Array.isArray(d.username) && d.username[0]) return d.username[0];
  if (Array.isArray(d.errors?.username) && d.errors.username[0]) return String(d.errors.username[0]);
  return fallback;
}
