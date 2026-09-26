import React, { useEffect, useMemo, useState } from 'react';

import type { Restaurant, Category, MenuItem } from '../../types';

import {

  createCategory, deleteCategory, createMenuItem, updateMenuItem, deleteMenuItem,

  toggleItemStock, fetchLowStockItems, reorderCategories, clearRestaurantMenu,

  createVariant, deleteVariant, createAddonGroup, deleteAddonGroup,

} from '../../api/dashboard';

import { parseApiError } from '../../utils/apiErrors';

import { buildSubdomainUrl } from '../../utils/tenant';



type ItemForm = { mode: 'new'; categoryId: number } | { mode: 'edit'; item: MenuItem };



interface Props {

  restaurant: Restaurant;

  onReload: () => void;

  showMsg: (text: string, type?: 'success' | 'error') => void;

}



export const MenuEditor: React.FC<Props> = ({ restaurant, onReload, showMsg }) => {

  const [categories, setCategories] = useState(restaurant.categories);

  const [itemForm, setItemForm] = useState<ItemForm | null>(null);

  const [dragCat, setDragCat] = useState<number | null>(null);

  const [clearOpen, setClearOpen] = useState(false);

  const [clearConfirm, setClearConfirm] = useState('');

  const [clearing, setClearing] = useState(false);

  const [lowStock, setLowStock] = useState<MenuItem[]>([]);



  useEffect(() => { setCategories(restaurant.categories); }, [restaurant.categories]);

  useEffect(() => {
    fetchLowStockItems().then(setLowStock).catch(() => setLowStock([]));
  }, [restaurant.categories]);



  const previewUrl = buildSubdomainUrl(restaurant.slug, '/', restaurant.access_mode === 'table_specific' ? '?table=1' : '');



  const stats = useMemo(() => {

    const items = categories.reduce((n, c) => n + c.items.length, 0);

    const available = categories.reduce((n, c) => n + c.items.filter((i) => i.is_available).length, 0);

    return { categories: categories.length, items, available };

  }, [categories]);



  const handleCatDrop = async (targetId: number) => {

    if (dragCat == null || dragCat === targetId) return;

    const reordered = [...categories];

    const fromIdx = reordered.findIndex((c) => c.id === dragCat);

    const toIdx = reordered.findIndex((c) => c.id === targetId);

    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = reordered.splice(fromIdx, 1);

    reordered.splice(toIdx, 0, moved);

    setCategories(reordered.map((c, i) => ({ ...c, order: i })));

    try {

      await reorderCategories(reordered.map((c, i) => ({ id: c.id, order: i })));

    } catch (e) {

      showMsg(parseApiError(e, 'تعذر إعادة الترتيب'), 'error');

      onReload();

    }

  };



  const saveItem = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    if (!itemForm) return;

    const fd = new FormData(e.currentTarget);

    const priceRaw = String(fd.get('base_price') ?? '').trim();

    const priceNum = Number(priceRaw);

    if (!priceRaw || Number.isNaN(priceNum) || priceNum < 0) {

      showMsg('السعر لازم يكون رقم (مثال: 5000 أو 12.50)', 'error');

      return;

    }

    fd.set('base_price', priceRaw);

    fd.set('is_available', 'true');

    try {

      if (itemForm.mode === 'edit') {

        await updateMenuItem(itemForm.item.id, fd);

        showMsg('تم تحديث الصنف');

      } else {

        fd.set('category', String(itemForm.categoryId));

        await createMenuItem(fd);

        showMsg('تم إضافة الصنف');

      }

      setItemForm(null);

      onReload();

    } catch (err) {

      showMsg(parseApiError(err, 'تعذر الحفظ'), 'error');

    }

  };



  const handleClearMenu = async () => {

    if (clearConfirm.trim() !== restaurant.slug) {

      showMsg(`اكتب "${restaurant.slug}" بالضبط للتأكيد`, 'error');

      return;

    }

    setClearing(true);

    try {

      const result = await clearRestaurantMenu(restaurant.slug, clearConfirm.trim());

      showMsg(`تم تصفير المنيو: ${result.deleted_categories} قسم، ${result.deleted_items} صنف`);

      setClearOpen(false);

      setClearConfirm('');

      setItemForm(null);

      onReload();

    } catch (e) {

      showMsg(parseApiError(e, 'تعذر تصفير المنيو'), 'error');

    } finally {

      setClearing(false);

    }

  };



  const editingItem = itemForm?.mode === 'edit' ? itemForm.item : null;



  const inputClass =

    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50';



  return (

    <div className="space-y-6">

      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-white px-5 py-4 text-slate-900 shadow-sm">
          <p className="font-black text-amber-800">⚠️ تنبيه مخزون — {lowStock.length} صنف قريب من النفاد</p>
          <p className="text-xs text-slate-600 mt-1 truncate">
            {lowStock.map((i) => i.name).join(' · ')}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">

        {[

          { label: 'الأقسام', value: stats.categories, icon: '🗂️' },

          { label: 'الأصناف', value: stats.items, icon: '🍽️' },

          { label: 'متوفرة الآن', value: stats.available, icon: '✅' },

        ].map((s) => (

          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm">

            <div className="flex items-center justify-between">

              <span className="text-2xl">{s.icon}</span>

              <span className="text-2xl font-black text-white tabular-nums">{s.value}</span>

            </div>

            <p className="text-xs font-bold text-slate-400 mt-2">{s.label}</p>

          </div>

        ))}

      </div>



      <div className="grid xl:grid-cols-[1fr_320px] gap-6">

        <div className="space-y-5">

          <div className="flex flex-wrap gap-3 justify-between items-center">

            <div>

              <h2 className="text-xl font-black text-white">محرر المنيو</h2>

              <p className="text-xs text-slate-400 mt-0.5">اسحب الأقسام لإعادة الترتيب</p>

            </div>

            <div className="flex flex-wrap gap-2">

              <button

                type="button"

                onClick={async () => {

                  const name = prompt('اسم القسم:');

                  if (!name?.trim()) return;

                  try {

                    await createCategory({ name: name.trim(), order: categories.length });

                    showMsg('تم إضافة القسم');

                    onReload();

                  } catch (e) {

                    showMsg(parseApiError(e, 'خطأ'), 'error');

                  }

                }}

                className="px-4 py-2.5 rounded-xl text-sm font-black bg-gradient-to-l from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/30 hover:brightness-110 transition-all"

              >

                + قسم جديد

              </button>

              <button

                type="button"

                onClick={() => setClearOpen(true)}

                disabled={stats.categories === 0 && stats.items === 0}

                className="px-4 py-2.5 rounded-xl text-sm font-black border border-red-500/40 text-red-300 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"

              >

                تصفير المنيو

              </button>

            </div>

          </div>



          {categories.length === 0 && (

            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">

              <p className="text-4xl mb-4">📋</p>

              <p className="font-black text-white">المنيو فارغ</p>

              <p className="text-sm text-slate-400 mt-2">ابدأ بإضافة قسم ثم أضف الأصناف</p>

            </div>

          )}



          {categories.map((cat: Category) => (

            <div

              key={cat.id}

              draggable

              onDragStart={() => setDragCat(cat.id)}

              onDragOver={(e) => e.preventDefault()}

              onDrop={() => handleCatDrop(cat.id)}

              className="rounded-2xl border border-white/10 bg-[#161a22]/80 overflow-hidden shadow-xl shadow-black/20"

            >

              <div className="flex items-center justify-between px-5 py-4 bg-white/[0.03] border-b border-white/8 cursor-grab active:cursor-grabbing">

                <div>

                  <h3 className="font-black text-white">{cat.name}</h3>

                  <p className="text-[10px] text-slate-500 mt-0.5">{cat.items.length} صنف · ↕ اسحب للترتيب</p>

                </div>

                <div className="flex gap-2">

                  <button

                    type="button"

                    onClick={() => setItemForm({ mode: 'new', categoryId: cat.id })}

                    className="px-3 py-1.5 rounded-lg text-xs font-black bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30"

                  >

                    + صنف

                  </button>

                  <button

                    type="button"

                    onClick={async () => {

                      if (!confirm(`حذف قسم «${cat.name}» وجميع أصنافه؟`)) return;

                      try {

                        await deleteCategory(cat.id);

                        showMsg('تم حذف القسم');

                        onReload();

                      } catch (e) {

                        showMsg(parseApiError(e, 'تعذر الحذف'), 'error');

                      }

                    }}

                    className="px-3 py-1.5 rounded-lg text-xs font-black text-red-400 hover:bg-red-500/10"

                  >

                    حذف

                  </button>

                </div>

              </div>

              <ul className="divide-y divide-white/5">

                {cat.items.length === 0 && (

                  <li className="px-5 py-6 text-center text-xs text-slate-500">لا أصناف في هذا القسم</li>

                )}

                {cat.items.map((item) => (

                  <li key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">

                    {item.image ? (

                      <img src={item.image} alt="" className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10" />

                    ) : (

                      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center text-xl">🍴</div>

                    )}

                    <div className="flex-1 min-w-0">

                      <p className="font-bold text-white truncate">{item.name}</p>

                      <p className="text-xs text-slate-400 mt-0.5">

                        {item.base_price} {restaurant.currency_code}

                      </p>

                    </div>

                    <button

                      type="button"

                      role="switch"

                      aria-checked={item.is_available}

                      onClick={() => toggleItemStock(item.id).then(onReload)}

                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${

                        item.is_available ? 'bg-emerald-500' : 'bg-slate-500'

                      }`}

                      title={item.is_available ? 'متوفر' : 'نفذت الكمية'}

                    >

                      <span

                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${

                          item.is_available ? 'start-0.5' : 'start-[calc(100%-1.375rem)]'

                        }`}

                      />

                    </button>

                    <button

                      type="button"

                      onClick={() => setItemForm({ mode: 'edit', item })}

                      className="text-xs font-black text-indigo-300 hover:text-indigo-200"

                    >

                      تعديل

                    </button>

                  </li>

                ))}

              </ul>

            </div>

          ))}



          {itemForm && (

            <form onSubmit={saveItem} className="rounded-2xl border border-indigo-500/30 bg-[#161a22] p-6 space-y-4 shadow-2xl shadow-indigo-950/30">

              <h3 className="font-black text-lg text-white">

                {itemForm.mode === 'edit' ? 'تعديل صنف' : 'صنف جديد'}

              </h3>

              <input name="name" required defaultValue={editingItem?.name} placeholder="اسم الصنف" className={inputClass} />

              <input

                name="base_price"

                type="number"

                min={0}

                step="0.01"

                required

                inputMode="decimal"

                defaultValue={editingItem?.base_price}

                placeholder="السعر (أرقام فقط)"

                className={inputClass}

              />

              <textarea

                name="description"

                defaultValue={editingItem?.description}

                placeholder="الوصف (اختياري)"

                className={`${inputClass} resize-none`}

                rows={3}

              />

              <div className="grid sm:grid-cols-2 gap-3">

                <label className="block">

                  <span className="text-xs font-bold text-slate-400 mb-1.5 block">الكمية في المخزون</span>

                  <input

                    name="stock_quantity"

                    type="number"

                    min={0}

                    defaultValue={editingItem?.stock_quantity ?? ''}

                    placeholder="اتركه فارغاً بدون تتبع"

                    className={inputClass}

                  />

                </label>

                <label className="block">

                  <span className="text-xs font-bold text-slate-400 mb-1.5 block">حد التنبيه (منخفض)</span>

                  <input

                    name="low_stock_threshold"

                    type="number"

                    min={0}

                    defaultValue={editingItem?.low_stock_threshold ?? 5}

                    className={inputClass}

                  />

                </label>

              </div>

              <label className="block">

                <span className="text-xs font-bold text-slate-400 mb-1.5 block">صورة الصنف</span>

                <input name="image" type="file" accept="image/*" className="w-full text-xs text-slate-400 file:me-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-bold" />

              </label>

              {editingItem && (

                <div className="space-y-3 border-t border-white/10 pt-4 text-sm text-slate-300">

                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">الأحجام (Variants)</p>

                  {editingItem.variants?.map((v) => (

                    <div key={v.id} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">

                      <span>{v.name} — {v.price}</span>

                      <button type="button" onClick={() => deleteVariant(v.id).then(onReload)} className="text-red-400 text-xs font-bold">حذف</button>

                    </div>

                  ))}

                  <button

                    type="button"

                    className="text-xs text-indigo-300 font-bold"

                    onClick={async () => {

                      const name = prompt('اسم الحجم:');

                      const price = prompt('السعر:');

                      if (!name || !price) return;

                      await createVariant({ menu_item: editingItem.id, name, price });

                      onReload();

                    }}

                  >

                    + حجم

                  </button>

                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider pt-2">الإضافات</p>

                  {editingItem.addon_groups?.map((g) => (

                    <div key={g.id} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">

                      <span>{g.name}</span>

                      <button type="button" onClick={() => deleteAddonGroup(g.id).then(onReload)} className="text-red-400 text-xs font-bold">حذف</button>

                    </div>

                  ))}

                  <button

                    type="button"

                    className="text-xs text-indigo-300 font-bold"

                    onClick={async () => {

                      const name = prompt('اسم مجموعة الإضافات:');

                      if (!name) return;

                      await createAddonGroup({ menu_item: editingItem.id, name, addons: [] });

                      onReload();

                    }}

                  >

                    + مجموعة إضافات

                  </button>

                </div>

              )}

              <div className="flex flex-wrap gap-2 pt-2">

                <button type="submit" className="flex-1 min-w-[120px] py-3 rounded-xl font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">

                  حفظ

                </button>

                <button type="button" onClick={() => setItemForm(null)} className="px-5 py-3 rounded-xl font-bold bg-white/5 text-slate-300 hover:bg-white/10">

                  إلغاء

                </button>

                {editingItem && (

                  <button

                    type="button"

                    onClick={async () => {

                      if (!confirm('حذف هذا الصنف؟')) return;

                      await deleteMenuItem(editingItem.id);

                      setItemForm(null);

                      onReload();

                    }}

                    className="px-5 py-3 rounded-xl font-bold text-red-400 hover:bg-red-500/10"

                  >

                    حذف الصنف

                  </button>

                )}

              </div>

            </form>

          )}

        </div>



        <div className="rounded-2xl border border-white/10 bg-[#161a22] p-4 h-fit xl:sticky xl:top-6">

          <div className="flex items-center justify-between mb-3">

            <h3 className="font-black text-white text-sm">معاينة مباشرة</h3>

            <span className="text-[10px] text-emerald-400 font-bold">● Live</span>

          </div>

          <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black">

            <iframe title="preview" src={previewUrl} className="w-full h-[520px] bg-white" />

          </div>

          <a

            href={previewUrl}

            target="_blank"

            rel="noreferrer"

            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-black bg-white/5 text-indigo-200 hover:bg-white/10 border border-white/10"

          >

            فتح المنيو في تبويب جديد ↗

          </a>

        </div>

      </div>



      {clearOpen && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#1a1f28] p-6 shadow-2xl" dir="rtl">

            <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center text-2xl mb-4 mx-auto">⚠️</div>

            <h3 className="text-lg font-black text-white text-center">تصفير المنيو بالكامل</h3>

            <p className="text-sm text-slate-400 text-center mt-2 leading-relaxed">

              راح ينحذف <strong className="text-red-300">كل الأقسام والأصناف</strong> ({stats.categories} قسم، {stats.items} صنف).

              <br />

              ما ينعكس على الطاولات أو الهوية البصرية.

            </p>

            <p className="text-xs text-slate-500 mt-4 mb-2">

              للتأكيد اكتب slug المطعم: <code className="text-indigo-300 font-mono" dir="ltr">{restaurant.slug}</code>

            </p>

            <input

              value={clearConfirm}

              onChange={(e) => setClearConfirm(e.target.value)}

              placeholder={restaurant.slug}

              dir="ltr"

              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white text-center font-mono focus:outline-none focus:ring-2 focus:ring-red-500/40"

            />

            <div className="flex gap-3 mt-6">

              <button

                type="button"

                disabled={clearing}

                onClick={handleClearMenu}

                className="flex-1 py-3 rounded-xl font-black bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"

              >

                {clearing ? 'جاري الحذف...' : 'نعم، صفّر المنيو'}

              </button>

              <button

                type="button"

                disabled={clearing}

                onClick={() => { setClearOpen(false); setClearConfirm(''); }}

                className="flex-1 py-3 rounded-xl font-bold bg-white/5 text-slate-300 hover:bg-white/10"

              >

                إلغاء

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};


