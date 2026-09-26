import React, { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '../store/useAuthStore';

import { fetchMe } from '../api/auth';

import { defaultTabForRole, tabsForRole } from '../utils/dashboardTabs';

import {

  fetchMyRestaurant, updateBranding,

  fetchTables, createTable, deleteTable, bulkGenerateTables, downloadTableQr,

  downloadGeneralQr, downloadGeneralBarcode, downloadTableBarcode, downloadTablesPdf,

} from '../api/dashboard';

import type { Restaurant } from '../types';

import { buildSubdomainUrl } from '../utils/tenant';

import { parseApiError } from '../utils/apiErrors';

import { AnalyticsPanel } from '../components/dashboard/AnalyticsPanel';

import { MenuEditor } from '../components/dashboard/MenuEditor';

import { PromotionsPanel } from '../components/dashboard/PromotionsPanel';

import { ReservationsPanel } from '../components/dashboard/ReservationsPanel';

import { DashboardShell, type DashboardTab } from '../components/dashboard/DashboardShell';

import { LiveOrdersPanel } from '../components/dashboard/LiveOrdersPanel';

import { StaffPanel } from '../components/dashboard/StaffPanel';

import { ReportsPanel } from '../components/dashboard/ReportsPanel';

import { MENU_THEMES } from '../themes';



const panelClass = 'rounded-3xl border border-white/10 bg-[#161a22]/90 p-6 md:p-8 shadow-xl shadow-black/20';



export const TenantDashboard: React.FC = () => {

  const navigate = useNavigate();

  const { user, restaurants, logout } = useAuthStore();

  const [tab, setTab] = useState<DashboardTab>(() => defaultTabForRole(useAuthStore.getState().user?.tenant_role));

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const [tables, setTables] = useState<Array<{ id: number; number: string; label: string; menu_url: string }>>([]);

  const [loading, setLoading] = useState(true);

  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);



  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {

    setMsg({ text, type });

    setTimeout(() => setMsg(null), 4500);

  };



  const load = useCallback(async () => {

    setLoading(true);

    try {

      const data = await fetchMyRestaurant();

      setRestaurant(data);

      const t = await fetchTables();

      setTables(t);

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر تحميل بيانات المطعم'), 'error');

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => { load(); }, [load]);



  useEffect(() => {

    fetchMe()

      .then((me) => {

        useAuthStore.setState({ user: me.user, restaurants: me.restaurants });

        if (me.user.tenant_role === 'kitchen') navigate('/kitchen', { replace: true });

      })

      .catch(() => {});

  }, [navigate]);



  useEffect(() => {

    if (user?.tenant_role === 'kitchen') navigate('/kitchen', { replace: true });

    const allowed = tabsForRole(user?.tenant_role);

    if (allowed.length && !allowed.includes(tab)) setTab(defaultTabForRole(user?.tenant_role));

  }, [user?.tenant_role, tab, navigate]);



  const slug = restaurant?.slug || restaurants[0]?.slug;

  const menuPreviewUrl = slug ? buildSubdomainUrl(slug, '/', restaurant?.access_mode === 'table_specific' ? '?table=1' : '') : null;



  const downloadBlob = (blob: Blob, filename: string) => {

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');

    a.href = url;

    a.download = filename;

    a.click();

    URL.revokeObjectURL(url);

  };



  const handleBrandingSave = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    if (!restaurant || !slug) return;

    const fd = new FormData(e.currentTarget);

    try {

      await updateBranding(slug, fd);

      showMsg('تم حفظ الهوية البصرية');

      load();

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر حفظ التغييرات'), 'error');

    }

  };



  const handleBulkTables = async () => {

    const count = parseInt(prompt('كم طاولة؟ (1-100)', '10') || '0', 10);

    if (!count) return;

    try {

      const result = await bulkGenerateTables(count);

      showMsg(`تم إنشاء ${result.created} طاولة جديدة`);

      load();

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر توليد الطاولات'), 'error');

    }

  };



  const handleDownloadQr = async (tableId: number, number: string, format: 'png' | 'svg') => {

    try {

      const blob = await downloadTableQr(tableId, format);

      downloadBlob(blob, `${slug}-table-${number}.${format}`);

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر تحميل QR'), 'error');

    }

  };



  const handleDownloadGeneralQr = async () => {

    if (!slug) return;

    try {

      const blob = await downloadGeneralQr(slug);

      downloadBlob(blob, `${slug}-general-qr.png`);

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر تحميل QR العام'), 'error');

    }

  };



  const handleDownloadGeneralBarcode = async () => {

    if (!slug) return;

    try {

      const blob = await downloadGeneralBarcode(slug);

      downloadBlob(blob, `${slug}-general-barcode.png`);

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر تحميل الباركود'), 'error');

    }

  };



  const handleDownloadTableBarcode = async (tableId: number, number: string) => {

    try {

      const blob = await downloadTableBarcode(tableId);

      downloadBlob(blob, `${slug}-table-${number}-barcode.png`);

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر تحميل الباركود'), 'error');

    }

  };



  const handleDownloadPdf = async () => {

    if (!slug) return;

    const count = parseInt(prompt('عدد الطاولات في PDF؟ (1-100)', String(tables.length || 20)) || '0', 10);

    if (!count) return;

    try {

      const blob = await downloadTablesPdf(slug, count);

      downloadBlob(blob, `${slug}-tables-qrs.pdf`);

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر تحميل PDF'), 'error');

    }

  };



  if (loading) {

    return (

      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f1117] text-slate-400" dir="rtl">

        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />

        <p className="font-bold">جاري تحميل لوحة التحكم...</p>

      </div>

    );

  }



  const fieldClass =

    'w-full mt-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40';

  const contactFieldClass =

    'w-full mt-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';

  const contactLabelClass = 'text-xs font-bold text-slate-300';

  const labelClass = 'text-xs font-bold text-slate-400';



  return (

    <DashboardShell

      restaurant={restaurant}

      userName={user?.username}

      isSuperuser={user?.is_superuser}

      tab={tab}

      onTabChange={setTab}

      menuPreviewUrl={menuPreviewUrl}

      onLogout={logout}

      msg={msg}

      tenantRole={user?.tenant_role}

    >

      {tab === 'menu' && restaurant && (

        <MenuEditor restaurant={restaurant} onReload={load} showMsg={showMsg} />

      )}



      {tab === 'orders' && <LiveOrdersPanel />}



      {tab === 'analytics' && <AnalyticsPanel />}



      {tab === 'reports' && <ReportsPanel />}



      {tab === 'staff' && <StaffPanel showMsg={showMsg} />}



      {tab === 'promotions' && <PromotionsPanel showMsg={showMsg} />}



      {tab === 'reservations' && <ReservationsPanel showMsg={showMsg} />}



      {tab === 'branding' && restaurant && (

        <form onSubmit={handleBrandingSave} className={`${panelClass} max-w-2xl space-y-5`}>

          <div>

            <h2 className="text-xl font-black text-white">الهوية البصرية</h2>

            <p className="text-xs text-slate-400 mt-1">ألوان، شعار، وثيم المنيو الظاهر للزبائن</p>

          </div>

          <div className="grid sm:grid-cols-3 gap-4">

            <label className="block">

              <span className={labelClass}>اللون الأساسي</span>

              <input name="primary_color" type="color" defaultValue={restaurant.primary_color} className="w-full h-11 rounded-xl cursor-pointer bg-transparent" />

            </label>

            <label className="block">

              <span className={labelClass}>اللون الثانوي</span>

              <input name="secondary_color" type="color" defaultValue={restaurant.secondary_color} className="w-full h-11 rounded-xl cursor-pointer bg-transparent" />

            </label>

            <label className="block">

              <span className={labelClass}>لون QR</span>

              <input name="qr_color" type="color" defaultValue={restaurant.qr_color || '#000000'} className="w-full h-11 rounded-xl cursor-pointer bg-transparent" />

            </label>

          </div>

          <label className="block">

            <span className={labelClass}>رقم واتساب لاستلام الطلبات</span>

            <input

              name="whatsapp_number"

              dir="ltr"

              defaultValue={restaurant.whatsapp_number || ''}

              placeholder="9647700000000"

              className={fieldClass}

            />

            <p className="text-[10px] text-slate-500 mt-1">يُنشئ رابط واتساب تلقائياً بعد طلب الزبون من المنيو</p>

          </label>



          <label className="block">

            <span className={contactLabelClass}>هاتف المطعم</span>

            <input name="phone" defaultValue={restaurant.phone || ''} placeholder="07xxxxxxxx" className={contactFieldClass} />

          </label>



          <label className="block">

            <span className={contactLabelClass}>بريد استلام التقارير والإشعارات</span>

            <input

              name="notification_email"

              type="email"

              dir="ltr"

              defaultValue={restaurant.notification_email || ''}

              placeholder="reports@your-restaurant.com"

              className={contactFieldClass}

            />

            <p className="text-[10px] text-slate-400 mt-1">

              الإيميل الذي ستصلك عليه تقارير نهاية اليوم (Z-Report) وتنبيهات النظام.

            </p>

          </label>



          <label className="block">

            <span className={labelClass}>نظام الوصول</span>

            <select name="access_mode" defaultValue={restaurant.access_mode} className={fieldClass}>

              <option value="table_specific">QR لكل طاولة</option>

              <option value="general">منيو عام واحد</option>

            </select>

          </label>

          <label className="block">

            <span className={labelClass}>ثيم المنيو</span>

            <select name="menu_theme" defaultValue={restaurant.menu_theme} className={fieldClass}>

              {MENU_THEMES.map((theme) => (

                <option key={theme.id} value={theme.id} className="bg-slate-900">

                  {theme.nameAr} — {theme.nameEn}

                </option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className={labelClass}>ثيم صفحة الهبوط</span>

            <select name="landing_theme" defaultValue={(restaurant as Restaurant & { landing_theme?: string }).landing_theme || 'default'} className={fieldClass}>

              <option value="default" className="bg-slate-900">افتراضي</option>

              <option value="luxury" className="bg-slate-900">فاخر</option>

              <option value="minimal" className="bg-slate-900">Minimal</option>

              <option value="heritage" className="bg-slate-900">تراثي</option>

            </select>

          </label>

          <label className="block">

            <span className={labelClass}>الشعار</span>

            <input name="logo" type="file" accept="image/*" className="w-full mt-1.5 text-xs text-slate-400 file:me-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-bold" />

          </label>

          <label className="block">

            <span className={labelClass}>صورة الغلاف</span>

            <input name="cover_image" type="file" accept="image/*" className="w-full mt-1.5 text-xs text-slate-400 file:me-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-bold" />

          </label>

          <button type="submit" className="w-full py-3.5 rounded-2xl font-black bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/40 hover:brightness-110 transition-all">

            حفظ التغييرات

          </button>

        </form>

      )}



      {tab === 'tables' && (

        <div className="space-y-6">

          {slug && (

            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 text-sm">

              <p className="font-black text-indigo-100 mb-2">رابط المنيو</p>

              <code className="text-indigo-200 text-xs break-all block bg-black/20 rounded-lg px-3 py-2" dir="ltr">

                {buildSubdomainUrl(slug)}

              </code>

              <p className="text-indigo-200/70 text-xs mt-3">

                {restaurant?.access_mode === 'general' ? 'وضع منيو عام — QR واحد' : 'وضع طاولات — QR لكل طاولة'}

              </p>

            </div>

          )}



          <div className={`${panelClass} flex flex-col sm:flex-row gap-6 items-start`}>

            {restaurant?.qr_code && (

              <img src={restaurant.qr_code} alt="QR" className="w-36 h-36 rounded-2xl border border-white/10 bg-white p-2" />

            )}

            <div className="flex flex-wrap gap-2">

              <button type="button" onClick={handleDownloadGeneralQr} className="px-4 py-2.5 rounded-xl text-sm font-black bg-indigo-600 text-white hover:bg-indigo-500">

                QR عام PNG

              </button>

              <button type="button" onClick={handleDownloadGeneralBarcode} className="px-4 py-2.5 rounded-xl text-sm font-black bg-violet-600 text-white hover:bg-violet-500">

                Barcode 1D

              </button>

              <button type="button" onClick={handleDownloadPdf} className="px-4 py-2.5 rounded-xl text-sm font-black bg-rose-600 text-white hover:bg-rose-500">

                PDF كل الطاولات

              </button>

            </div>

          </div>



          <div className="flex flex-wrap gap-2">

            <button type="button" onClick={handleBulkTables} className="px-4 py-2.5 rounded-xl text-sm font-black bg-indigo-600 text-white">

              توليد طاولات (1–N)

            </button>

            <button

              type="button"

              onClick={async () => {

                const num = prompt('رقم الطاولة:');

                if (!num) return;

                try {

                  await createTable(num);

                  showMsg('تمت إضافة الطاولة');

                  load();

                } catch (err) {

                  showMsg(parseApiError(err, 'تعذر إضافة الطاولة'), 'error');

                }

              }}

              className="px-4 py-2.5 rounded-xl text-sm font-black bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10"

            >

              + طاولة واحدة

            </button>

          </div>



          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

            {tables.map((t) => (

              <div key={t.id} className="rounded-2xl border border-white/10 bg-[#161a22] p-5">

                <p className="font-black text-lg text-white">طاولة {t.number}</p>

                <p className="text-[10px] text-slate-500 truncate mb-4 mt-1" dir="ltr">{t.menu_url}</p>

                <div className="flex flex-wrap gap-2">

                  <button type="button" onClick={() => handleDownloadQr(t.id, t.number, 'png')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-200">PNG</button>

                  <button type="button" onClick={() => handleDownloadQr(t.id, t.number, 'svg')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-300">SVG</button>

                  <button type="button" onClick={() => handleDownloadTableBarcode(t.id, t.number)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-500/20 text-violet-200">1D</button>

                  <button

                    type="button"

                    onClick={async () => {

                      if (!confirm('حذف هذه الطاولة؟')) return;

                      try {

                        await deleteTable(t.id);

                        showMsg('تم الحذف');

                        load();

                      } catch (err) {

                        showMsg(parseApiError(err, 'تعذر الحذف'), 'error');

                      }

                    }}

                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10"

                  >

                    حذف

                  </button>

                </div>

              </div>

            ))}

          </div>

          {tables.length === 0 && (

            <p className="text-center text-slate-500 py-16">لا توجد طاولات — اضغط «توليد طاولات»</p>

          )}

        </div>

      )}

    </DashboardShell>

  );

};


