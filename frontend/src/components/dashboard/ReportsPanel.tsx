import React, { useState } from 'react';
import { downloadAnalyticsReport } from '../../api/reports';

const PERIODS = [
  ['day', 'اليوم'],
  ['week', 'أسبوع'],
  ['month', 'شهر'],
] as const;

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ReportsPanel: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [busy, setBusy] = useState<'pdf' | 'xlsx' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = async (format: 'pdf' | 'xlsx') => {
    setBusy(format);
    setError(null);
    try {
      const blob = await downloadAnalyticsReport(period, format);
      saveBlob(blob, `sales-${period}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
    } catch {
      setError('تعذر التصدير — تأكد من تسجيل الدخول');
    } finally {
      setBusy(null);
    }
  };

  const card = 'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-slate-900';

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-xl font-black text-white">التقارير والتصدير</h2>
        <p className="text-xs text-slate-400 mt-1">PDF و Excel للمبيعات والأصناف الأكثر مبيعاً</p>
      </div>

      <div className={`${card} space-y-4`}>
        <label className="block">
          <span className="text-xs font-bold text-slate-600">الفترة</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="w-full mt-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-500"
          >
            {PERIODS.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => download('pdf')}
            className="flex-1 min-w-[140px] py-3 rounded-2xl font-black bg-rose-600 text-white disabled:opacity-50"
          >
            {busy === 'pdf' ? '...' : 'تصدير PDF'}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => download('xlsx')}
            className="flex-1 min-w-[140px] py-3 rounded-2xl font-black bg-emerald-600 text-white disabled:opacity-50"
          >
            {busy === 'xlsx' ? '...' : 'تصدير Excel'}
          </button>
        </div>

        {error && <p className="text-sm font-bold text-red-600">{error}</p>}

        <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">
          تقرير Z اليومي يُرسل تلقائياً لإيميل صاحب المطعم عبر الأمر:{' '}
          <code className="text-slate-800 bg-slate-100 px-1 rounded">send_daily_z_report</code>
        </p>
      </div>
    </div>
  );
};
