import React, { useEffect, useState } from 'react';
import { fetchPromotions, createPromotion, deletePromotion, type Promotion, type PromoType } from '../../api/promotions';
import { parseApiError } from '../../utils/apiErrors';

const TYPES: { id: PromoType; label: string }[] = [
  { id: 'happy_hour', label: 'Happy Hour' },
  { id: 'category_discount', label: 'خصم قسم' },
  { id: 'buy_x_get_y', label: 'اشترِ 2 واحصل 1' },
  { id: 'coupon', label: 'كوبون' },
];

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
      <form onSubmit={handleCreate} className="bg-white rounded-2xl border p-5 grid sm:grid-cols-2 gap-4">
        <h3 className="sm:col-span-2 font-black">عرض / خصم جديد</h3>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم العرض" required className="border rounded-xl px-3 py-2" />
        <select value={form.promo_type} onChange={(e) => setForm({ ...form, promo_type: e.target.value as PromoType })} className="border rounded-xl px-3 py-2">
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        {form.promo_type === 'coupon' && (
          <input value={form.coupon_code} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} placeholder="كود الكوبون" className="border rounded-xl px-3 py-2" />
        )}
        <input value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="نسبة الخصم %" className="border rounded-xl px-3 py-2" />
        <button type="submit" className="sm:col-span-2 py-3 bg-indigo-600 text-white rounded-xl font-black">إضافة</button>
      </form>

      <div className="grid sm:grid-cols-2 gap-4">
        {list.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-black">{p.name}</p>
                <p className="text-xs text-gray-500">{TYPES.find((t) => t.id === p.promo_type)?.label}</p>
                {p.coupon_code && <code className="text-indigo-600 text-sm">{p.coupon_code}</code>}
              </div>
              <button onClick={async () => { await deletePromotion(p.id); load(); }} className="text-red-500 text-xs font-bold">حذف</button>
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-gray-400 col-span-2 text-center py-8">لا عروض</p>}
      </div>
    </div>
  );
};
