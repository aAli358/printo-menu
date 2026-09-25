import React, { useEffect, useState } from 'react';
import { fetchPlatformStats, patchPlatformSubscription, type PlatformStats } from '../api/platform';
import { parseApiError } from '../utils/apiErrors';
import { buildRootOriginUrl } from '../utils/tenant';

export const PlatformAdmin: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => fetchPlatformStats().then(setStats).catch((e) => setError(parseApiError(e, 'غير مصرح')));

  useEffect(() => { load(); }, []);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-8" dir="rtl">
        <p className="text-red-400 mb-4">{error}</p>
        <a href={buildRootOriginUrl('/dashboard')} className="text-indigo-400 font-bold">← لوحة المطعم</a>
      </div>
    );
  }

  if (!stats) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      <header className="border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black">Super Admin — E-Menu SaaS</h1>
        <a href={buildRootOriginUrl('/dashboard')} className="text-sm text-indigo-400 font-bold">لوحة المطعم</a>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { l: 'المطاعm', v: stats.total_restaurants },
            { l: 'نشطة', v: stats.active_restaurants },
            { l: 'MRR (تقدير)', v: `${stats.mrr_estimate_iqd.toLocaleString()} د.ع` },
            { l: 'طلبات الشهر', v: stats.monthly_orders },
          ].map((c) => (
            <div key={c.l} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-xs text-slate-400">{c.l}</p>
              <p className="text-2xl font-black mt-1">{c.v}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-black mb-4">خريطة المطاعm</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {stats.restaurants_map.map((r) => (
              <div key={r.id} className="bg-slate-800 rounded-xl p-4 text-sm">
                <p className="font-black">{r.name}</p>
                <p className="text-slate-400 text-xs">{r.slug} · {r.owner_username}</p>
                <p className="text-xs mt-1">{r.subscription_status} / {r.subscription_plan}</p>
                {r.custom_domain && <p className="text-indigo-300 text-xs mt-1">{r.custom_domain}</p>}
                {r.latitude && r.longitude && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=15/${r.latitude}/${r.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 text-xs block mt-1"
                  >
                    📍 الخريطة
                  </a>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  <button
                    onClick={async () => { await patchPlatformSubscription(r.id, { subscription_status: 'active', extend_days: 30 }); load(); }}
                    className="px-2 py-1 bg-emerald-700 rounded text-xs font-bold"
                  >
                    +30 يوم
                  </button>
                  <button
                    onClick={async () => { await patchPlatformSubscription(r.id, { subscription_status: 'suspended' }); load(); }}
                    className="px-2 py-1 bg-red-800 rounded text-xs font-bold"
                  >
                    إيقاف
                  </button>
                  <button
                    onClick={async () => { await patchPlatformSubscription(r.id, { is_active: !r.is_active }); load(); }}
                    className="px-2 py-1 bg-slate-600 rounded text-xs font-bold"
                  >
                    {r.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
