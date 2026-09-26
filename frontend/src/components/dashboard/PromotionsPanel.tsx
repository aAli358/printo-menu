import React, { useEffect, useState } from 'react';
import { fetchPromotions, createPromotion, deletePromotion, type Promotion, type PromoType } from '../../api/promotions';
import { parseApiError } from '../../utils/apiErrors';

const TYPES: { id: PromoType; label: string }[] = [
  { id: 'happy_hour', label: 'Happy Hour' },
  { id: 'category_discount', label: 'خصم قسم' },
  { id: 'buy_x_get_y', label: 'اشترِ 2 واحصل 1' },
  { id: 'coupon', label: 'كوبون' },
];

/** Visible on white cards inside dark tenant dashboard */
const PROMO_FIELD =
  'w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white bg-slate-50 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';

const PROMO_SELECT =
  `${PROMO_FIELD} cursor-pointer`;

export const PromotionsPanel: React.FC<{ showMsg: (t: string, type?: 'success' | 'error') => void }> = ({ showMsg }) => {
  const [list, setList] = useState<Promotion[]>([]);
  const [form, setForm] = useState({ name: '', promo_type: 'coupon' as PromoType, coupon_code: '', discount_percent: '10' });

  const load = () => fetchPromotions().then(setList).catch(() => {});

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPromotion({
        name: form.name,
        promo_type: form.promo_type,
        coupon_code: form.promo_type === 'coupon' ? form.coupon_code : '',
        discount_percent: form.discount_percent,
        is_active: true,
        buy_quantity: form.promo_type === 'buy_x_get_y' ? 2 : undefined,
        get_quantity: form.promo_type === 'buy_x_get_y' ? 1 : undefined,
      });
      showMsg('تم إنشاء العرض');
      setForm({ name: '', promo_type: 'coupon', coupon_code: '', discount_percent: '10' });
      load();
    } catch (err) {
      showMsg(parseApiError(err, 'خطأ'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="dashboard-light-card bg-white rounded-2xl border border-slate-200 p-5 grid sm:grid-cols-2 gap-4">
        <h3 className="sm:col-span-2 font-black text-slate-900">عرض / خصم جديد</h3>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="اسم العرض"
          required
          className={PROMO_FIELD}
        />
        <select
          value={form.promo_type}
          onChange={(e) => setForm({ ...form, promo_type: e.target.value as PromoType })}
          className={PROMO_SELECT}
        >
          {TYPES.map((t) => (
            <option key={t.id} value={t.id} className="bg-white text-gray-900">
              {t.label}
            </option>
          ))}
        </select>
        {form.promo_type === 'coupon' && (
          <input
            value={form.coupon_code}
            onChange={(e) => setForm({ ...form, coupon_code: e.target.value })}
            placeholder="كود الكوبون"
            className={PROMO_FIELD}
          />
        )}
        <input
          value={form.discount_percent}
          onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
          placeholder="نسبة الخصم %"
          className={PROMO_FIELD}
        />
        <button type="submit" className="sm:col-span-2 py-3 bg-indigo-600 text-white rounded-xl font-black">
          إضافة
        </button>
      </form>

      <div className="grid sm:grid-cols-2 gap-4">
        {list.map((p) => (
          <div key={p.id} className="dashboard-light-card bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-black text-slate-900">{p.name}</p>
                <p className="text-xs text-gray-500">{TYPES.find((t) => t.id === p.promo_type)?.label}</p>
                {p.coupon_code && <code className="text-indigo-600 text-sm">{p.coupon_code}</code>}
              </div>
              <button onClick={async () => { await deletePromotion(p.id); load(); }} className="text-red-500 text-xs font-bold">
                حذف
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-slate-400 col-span-2 text-center py-8">لا عروض</p>}
      </div>
    </div>
  );
};
