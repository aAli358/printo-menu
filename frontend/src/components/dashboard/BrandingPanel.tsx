import React, { useCallback, useEffect, useState } from 'react';
import type { Restaurant } from '../../types';
import { fetchMyRestaurant, updateBranding } from '../../api/dashboard';
import { parseApiError } from '../../utils/apiErrors';
import { MENU_THEMES } from '../../themes';

type BrandingForm = {
  primary_color: string;
  secondary_color: string;
  qr_color: string;
  phone: string;
  whatsapp_number: string;
  notification_email: string;
  access_mode: 'table_specific' | 'general';
  menu_theme: string;
  landing_theme: string;
};

function formFromRestaurant(r: Restaurant): BrandingForm {
  return {
    primary_color: r.primary_color || '#000000',
    secondary_color: r.secondary_color || '#FFFFFF',
    qr_color: r.qr_color || '#000000',
    phone: r.phone || '',
    whatsapp_number: r.whatsapp_number || '',
    notification_email: r.notification_email || '',
    access_mode: r.access_mode || 'table_specific',
    menu_theme: r.menu_theme || 'modern-indigo',
    landing_theme: r.landing_theme || 'default',
  };
}

interface Props {
  restaurant: Restaurant;
  slug: string;
  onSaved: () => void;
  showMsg: (text: string, type?: 'success' | 'error') => void;
}

const panelClass = 'rounded-3xl border border-white/10 bg-[#161a22]/90 p-6 md:p-8 shadow-xl shadow-black/20';
const fieldClass =
  'w-full mt-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40';
const contactFieldClass =
  'w-full mt-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';
const labelClass = 'text-xs font-bold text-slate-400';
const contactLabelClass = 'text-xs font-bold text-slate-300';

export const BrandingPanel: React.FC<Props> = ({ restaurant, slug, onSaved, showMsg }) => {
  const [form, setForm] = useState<BrandingForm>(() => formFromRestaurant(restaurant));
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant.logo);
  const [coverPreview, setCoverPreview] = useState<string | null>(restaurant.cover_image);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const applyRestaurant = useCallback((r: Restaurant) => {
    setForm(formFromRestaurant(r));
    setLogoPreview(r.logo);
    setCoverPreview(r.cover_image);
    setLogoFile(null);
    setCoverFile(null);
  }, []);

  useEffect(() => {
    applyRestaurant(restaurant);
  }, [restaurant, applyRestaurant]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMyRestaurant()
      .then((data) => {
        if (!cancelled) applyRestaurant(data);
      })
      .catch((e) => showMsg(parseApiError(e, 'تعذر تحميل إعدادات الهوية'), 'error'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [applyRestaurant, showMsg]);

  const set = (key: keyof BrandingForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        fd.append(key, value ?? '');
      });
      if (logoFile) fd.append('logo', logoFile);
      if (coverFile) fd.append('cover_image', coverFile);

      await updateBranding(slug, fd);
      showMsg('تم حفظ الهوية البصرية');
      onSaved();
    } catch (err) {
      showMsg(parseApiError(err, 'تعذر حفظ التغييرات'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`${panelClass} max-w-2xl text-center text-slate-400 py-12`}>
        جاري تحميل إعدادات الهوية...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`${panelClass} max-w-2xl space-y-5`}>
      <div>
        <h2 className="text-xl font-black text-white">الهوية البصرية</h2>
        <p className="text-xs text-slate-400 mt-1">عدّل ما تريد — لا حاجة لإعادة رفع الصور عند تغيير الثيم فقط</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block">
          <span className={labelClass}>اللون الأساسي</span>
          <input
            type="color"
            value={form.primary_color}
            onChange={(e) => set('primary_color', e.target.value)}
            className="w-full h-11 rounded-xl cursor-pointer bg-transparent"
          />
        </label>
        <label className="block">
          <span className={labelClass}>اللون الثانوي</span>
          <input
            type="color"
            value={form.secondary_color}
            onChange={(e) => set('secondary_color', e.target.value)}
            className="w-full h-11 rounded-xl cursor-pointer bg-transparent"
          />
        </label>
        <label className="block">
          <span className={labelClass}>لون QR</span>
          <input
            type="color"
            value={form.qr_color}
            onChange={(e) => set('qr_color', e.target.value)}
            className="w-full h-11 rounded-xl cursor-pointer bg-transparent"
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>رقم واتساب لاستلام الطلبات</span>
        <input
          name="whatsapp_number"
          dir="ltr"
          value={form.whatsapp_number}
          onChange={(e) => set('whatsapp_number', e.target.value)}
          placeholder="9647700000000"
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className={contactLabelClass}>هاتف المطعم</span>
        <input
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="07xxxxxxxx"
          className={contactFieldClass}
        />
      </label>

      <label className="block">
        <span className={contactLabelClass}>بريد استلام التقارير والإشعارات</span>
        <input
          type="email"
          dir="ltr"
          value={form.notification_email}
          onChange={(e) => set('notification_email', e.target.value)}
          placeholder="reports@your-restaurant.com"
          className={contactFieldClass}
        />
      </label>

      <label className="block">
        <span className={labelClass}>نظام الوصول</span>
        <select
          value={form.access_mode}
          onChange={(e) => set('access_mode', e.target.value)}
          className={fieldClass}
        >
          <option value="table_specific" className="bg-slate-900">QR لكل طاولة</option>
          <option value="general" className="bg-slate-900">منيو عام واحد</option>
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>ثيم المنيو</span>
        <select
          value={form.menu_theme}
          onChange={(e) => set('menu_theme', e.target.value)}
          className={fieldClass}
        >
          {MENU_THEMES.map((theme) => (
            <option key={theme.id} value={theme.id} className="bg-slate-900">
              {theme.nameAr} — {theme.nameEn}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={labelClass}>ثيم صفحة الهبوط</span>
        <select
          value={form.landing_theme}
          onChange={(e) => set('landing_theme', e.target.value)}
          className={fieldClass}
        >
          <option value="default" className="bg-slate-900">افتراضي</option>
          <option value="luxury" className="bg-slate-900">فاخر</option>
          <option value="minimal" className="bg-slate-900">Minimal</option>
          <option value="heritage" className="bg-slate-900">تراثي</option>
        </select>
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className={labelClass}>الشعار (اختياري)</span>
          {logoPreview && (
            <img src={logoPreview} alt="" className="mt-2 mb-2 w-20 h-20 rounded-xl object-cover border border-white/10" />
          )}
          <input
            type="file"
            accept="image/*"
            className="w-full mt-1.5 text-xs text-slate-400 file:me-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-bold"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setLogoFile(file);
              setLogoPreview(URL.createObjectURL(file));
            }}
          />
        </label>
        <label className="block">
          <span className={labelClass}>صورة الغلاف (اختياري)</span>
          {coverPreview && (
            <img src={coverPreview} alt="" className="mt-2 mb-2 w-full max-h-24 rounded-xl object-cover border border-white/10" />
          )}
          <input
            type="file"
            accept="image/*"
            className="w-full mt-1.5 text-xs text-slate-400 file:me-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-bold"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setCoverFile(file);
              setCoverPreview(URL.createObjectURL(file));
            }}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 rounded-2xl font-black bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40 hover:brightness-110 transition-all disabled:opacity-60"
      >
        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
      </button>
    </form>
  );
};
