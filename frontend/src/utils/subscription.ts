/** Subscription status helpers for tenant dashboard. */

export type SubscriptionStatus = 'trial' | 'active' | 'suspended' | 'cancelled';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trial: 'تجريبي',
  active: 'نشط',
  suspended: 'موقوف',
  cancelled: 'منتهي',
};

export function getSubscriptionLabel(status?: string): string {
  return STATUS_LABELS[(status as SubscriptionStatus) ?? 'trial'] ?? status ?? '—';
}

export function getSubscriptionBadgeClass(status?: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'trial': return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-600 border-gray-200';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

/** Days until expiry; null if no date. Negative = expired. */
export function daysUntilExpiry(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getExpiryWarning(expiresAt?: string | null, status?: string): string | null {
  if (status === 'suspended' || status === 'cancelled') {
    return status === 'suspended' ? 'الاشتراك موقوف — تواصل مع الدعم.' : 'الاشتراك منتهي — جدّد للاستمرار.';
  }
  const days = daysUntilExpiry(expiresAt);
  if (days === null) return null;
  if (days < 0) return 'انتهى الاشتراك — جدّد الآن.';
  if (days <= 7) return `ينتهي الاشتراك خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}.`;
  return null;
}
