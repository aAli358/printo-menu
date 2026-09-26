import React from 'react';
import { Link } from 'react-router-dom';
import type { Restaurant } from '../../types';
import { buildRootOriginUrl, isRootDomain } from '../../utils/tenant';
import {
  getSubscriptionLabel, getSubscriptionBadgeClass, getExpiryWarning,
} from '../../utils/subscription';

export type DashboardTab = 'menu' | 'analytics' | 'promotions' | 'reservations' | 'branding' | 'tables';

const NAV: { id: DashboardTab; label: string; icon: string; desc: string }[] = [
  { id: 'menu', label: 'المنيو', icon: '📋', desc: 'أقسام وأصناف' },
  { id: 'analytics', label: 'الإحصائيات', icon: '📊', desc: 'مبيعات وتقييمات' },
  { id: 'promotions', label: 'العروض', icon: '🏷️', desc: 'كوبونات وخصومات' },
  { id: 'reservations', label: 'الحجوزات', icon: '📅', desc: 'طاولات وانتظار' },
  { id: 'branding', label: 'الهوية', icon: '🎨', desc: 'ألوان وثيم' },
  { id: 'tables', label: 'QR والطاولات', icon: '📱', desc: 'باركود وطباعة' },
];

interface Props {
  restaurant: Restaurant | null;
  userName?: string;
  isSuperuser?: boolean;
  tab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  menuPreviewUrl: string | null;
  onLogout: () => void;
  msg: { text: string; type: 'success' | 'error' } | null;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<Props> = ({
  restaurant,
  userName,
  isSuperuser,
  tab,
  onTabChange,
  menuPreviewUrl,
  onLogout,
  msg,
  children,
}) => {
  const subscriptionWarning = getExpiryWarning(
    restaurant?.subscription_expires_at,
    restaurant?.subscription_status,
  );

  /** Super Admin belongs on platform root only — not on tenant subdomains (restaurant owner UI). */
  const showPlatformAdminLink = Boolean(isSuperuser && isRootDomain());

  return (
    <div className="tenant-dashboard-dark min-h-screen bg-[#0f1117] text-slate-100" dir="rtl">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -end-24 h-80 w-80 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 start-1/4 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-e border-white/8 bg-[#12151c]/90 backdrop-blur-xl">
          <div className="p-6 border-b border-white/8">
            <div className="flex items-center gap-3">
              {restaurant?.logo ? (
                <img src={restaurant.logo} alt="" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/10" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                  🍽️
                </div>
              )}
              <div className="min-w-0">
                <p className="font-black text-white truncate">{restaurant?.name || 'لوحة التحكم'}</p>
                <p className="text-[11px] text-slate-400 truncate">مرحباً، {userName}</p>
              </div>
            </div>
            {restaurant && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${getSubscriptionBadgeClass(restaurant.subscription_status)}`}>
                  {getSubscriptionLabel(restaurant.subscription_status)}
                </span>
                {restaurant.subscription_plan && (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                    {restaurant.subscription_plan}
                  </span>
                )}
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-start transition-all ${
                  tab === item.id
                    ? 'bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-black">{item.label}</span>
                  <span className={`block text-[10px] truncate ${tab === item.id ? 'text-indigo-100/80' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/8 space-y-2">
            {menuPreviewUrl && (
              <a
                href={menuPreviewUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-indigo-200 border border-white/10 transition-colors"
              >
                معاينة المنيو ↗
              </a>
            )}
            <Link
              to="/kitchen"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-colors"
            >
              👨‍🍳 شاشة المطبخ
            </Link>
            {showPlatformAdminLink && (
              <a
                href={buildRootOriginUrl('/platform')}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-900/50 hover:bg-violet-900/70 text-sm font-bold border border-violet-500/30"
              >
                إدارة المنصة (Super Admin)
              </a>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-red-300 hover:bg-red-500/10 border border-red-500/20"
            >
              تسجيل الخروج
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {(subscriptionWarning || restaurant?.subscription_expires_at) && (
            <div className={`px-4 py-2.5 text-center text-xs font-bold border-b ${
              subscriptionWarning
                ? 'bg-amber-500/15 text-amber-200 border-amber-500/20'
                : 'bg-white/5 text-slate-400 border-white/8'
            }`}>
              {subscriptionWarning || (
                <>ينتهي الاشتراك: {new Date(restaurant!.subscription_expires_at!).toLocaleDateString('ar-EG')}</>
              )}
            </div>
          )}

          <header className="lg:hidden sticky top-0 z-40 border-b border-white/8 bg-[#12151c]/95 backdrop-blur-xl px-4 py-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h1 className="font-black text-white truncate">{restaurant?.name}</h1>
              <button type="button" onClick={onLogout} className="text-xs font-bold text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10">
                خروج
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap ${
                    tab === item.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          </header>

          {msg && (
            <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
              <div
                className={`pointer-events-auto max-w-md w-full px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl border ${
                  msg.type === 'error'
                    ? 'bg-red-950/95 text-red-100 border-red-500/30'
                    : 'bg-emerald-950/95 text-emerald-100 border-emerald-500/30'
                }`}
              >
                {msg.text}
              </div>
            </div>
          )}

          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
