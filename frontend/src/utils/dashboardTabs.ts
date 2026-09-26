import type { DashboardTab } from '../components/dashboard/DashboardShell';
import type { TenantRole } from '../store/useAuthStore';

const OWNER_TABS: DashboardTab[] = [
  'menu', 'orders', 'analytics', 'reports', 'promotions', 'reservations', 'staff', 'branding', 'tables',
];

export function tabsForRole(role?: TenantRole | null): DashboardTab[] {
  if (!role || role === 'owner') return OWNER_TABS;
  if (role === 'waiter') return ['orders', 'reservations'];
  if (role === 'cashier') return ['orders', 'analytics', 'reports'];
  if (role === 'kitchen') return [];
  return OWNER_TABS;
}

export function defaultTabForRole(role?: TenantRole | null): DashboardTab {
  const tabs = tabsForRole(role);
  return tabs[0] ?? 'orders';
}
