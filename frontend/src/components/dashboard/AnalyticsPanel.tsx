import React, { useEffect, useState } from 'react';
import { fetchAnalytics, type AnalyticsData } from '../../api/analytics';
import { parseApiError } from '../../utils/apiErrors';

const PERIODS = [
  ['day', 'اليوم'],
  ['week', 'أسبوع'],
  ['month', 'شهر'],
] as const;

function BarChart({ labels, values, color = 'bg-indigo-500' }: { labels: string[]; values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-40">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div className={`w-full rounded-t ${color}`} style={{ height: `${(v / max) * 100}%`, minHeight: v ? 4 : 0 }} />
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export const AnalyticsPanel: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics(period).then(setData).catch((e) => setError(parseApiError(e, 'تعذر تحميل الإحصائيات')));
  }, [period]);

  if (error) return <p className="text-red-600 font-bold p-4">{error}</p>;
  if (!data) return <p className="text-gray-400 p-8 text-center">جاري التحميل...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPeriod(id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold ${period === id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'الإيرادات', value: `${data.revenue.toLocaleString()} د.ع`, accent: 'text-indigo-600' },
          { label: 'الطلبات', value: String(data.order_count), accent: 'text-emerald-600' },
          { label: 'طلبات اليوم', value: String(data.orders_today), accent: 'text-amber-600' },
          { label: 'متوسط التحضير', value: data.avg_prep_minutes != null ? `${data.avg_prep_minutes} د` : '—', accent: 'text-violet-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border p-5">
            <p className="text-xs text-gray-500 font-bold">{c.label}</p>
            <p className={`text-2xl font-black mt-1 ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-black mb-4">المبيعات</h3>
          <BarChart
            labels={data.sales_by_day.map((d) => d.date.slice(5))}
            values={data.sales_by_day.map((d) => d.revenue)}
          />
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-black mb-4">أوقات الذروة</h3>
          <BarChart
            labels={data.peak_hours.map((h) => h.hour)}
            values={data.peak_hours.map((h) => h.count)}
            color="bg-amber-500"
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-black mb-4">الأكثر مبيعاً</h3>
          <ul className="space-y-2">
            {data.best_sellers.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="font-bold">{item.name}</span>
                <span className="text-gray-500">{item.quantity} × {item.revenue.toLocaleString()}</span>
              </li>
            ))}
            {data.best_sellers.length === 0 && <li className="text-gray-400 text-sm">لا بيانات</li>}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border p-5">
          <h3 className="font-black mb-4">
            التقييمات {data.avg_rating != null && <span className="text-amber-500">★ {data.avg_rating}</span>}
            <span className="text-xs text-gray-400 font-normal mr-2">({data.review_count})</span>
          </h3>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {data.recent_reviews.map((r) => (
              <li key={r.id} className="text-sm border-b pb-2">
                <div className="flex gap-2 items-center">
                  <span className="text-amber-500 font-black">{'★'.repeat(r.rating)}</span>
                  {r.table_number && <span className="text-xs text-gray-400">طاولة {r.table_number}</span>}
                </div>
                {r.comment && <p className="text-gray-600 mt-1">{r.comment}</p>}
              </li>
            ))}
            {data.recent_reviews.length === 0 && <li className="text-gray-400">لا تقييمات بعد</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};
