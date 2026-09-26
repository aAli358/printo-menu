import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchTables, createTable, updateTable, deleteTable, downloadTableQr,
  type RestaurantTableRow, type TableStatus,
} from '../../api/dashboard';
import { parseApiError } from '../../utils/apiErrors';

const STATUS_META: Record<TableStatus, { label: string; badge: string; next?: TableStatus }> = {
  available: { label: 'متاحة', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', next: 'occupied' },
  occupied: { label: 'مشغولة', badge: 'bg-red-100 text-red-800 border-red-200', next: 'reserved' },
  reserved: { label: 'محجوزة', badge: 'bg-amber-100 text-amber-900 border-amber-200', next: 'available' },
};

const modalFieldClass =
  'w-full mt-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40';

interface Props {
  showMsg: (text: string, type?: 'success' | 'error') => void;
}

export const TablesManagementSection: React.FC<Props> = ({ showMsg }) => {
  const [tables, setTables] = useState<RestaurantTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState(4);
  const [status, setStatus] = useState<TableStatus>('available');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    fetchTables()
      .then(setTables)
      .catch((e) => showMsg(parseApiError(e, 'تعذر تحميل الطاولات'), 'error'))
      .finally(() => setLoading(false));
  }, [showMsg]);

  useEffect(() => { load(); }, [load]);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createTable({
        table_number: tableNumber.trim(),
        capacity,
        status,
      });
      showMsg('تمت إضافة الطاولة');
      setModalOpen(false);
      setTableNumber('');
      setCapacity(4);
      setStatus('available');
      load();
    } catch (err) {
      showMsg(parseApiError(err, 'تعذر إضافة الطاولة'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const cycleStatus = async (table: RestaurantTableRow) => {
    const current: TableStatus = table.status ?? 'available';
    const next = STATUS_META[current]?.next ?? 'available';
    try {
      await updateTable(table.id, { status: next });
      load();
    } catch (err) {
      showMsg(parseApiError(err, 'تعذر تحديث الحالة'), 'error');
    }
  };

  const displayNumber = (t: RestaurantTableRow) => t.table_number || t.number;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black text-white">إدارة الطاولات</h3>
          <p className="text-xs text-slate-400 mt-1">الطاولات المادية، السعة، الحالة، وروابط QR</p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl font-black bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-500"
        >
          + إضافة طاولة جديدة
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-12">جاري التحميل...</p>
      ) : tables.length === 0 ? (
        <p className="text-slate-500 text-center py-16 rounded-2xl border border-white/10 bg-white/5">
          لا توجد طاولات — اضغط «إضافة طاولة جديدة»
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {tables.map((table) => {
            const num = displayNumber(table);
            const tableStatus: TableStatus = table.status ?? 'available';
            const meta = STATUS_META[tableStatus] || STATUS_META.available;
            return (
              <div
                key={table.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-slate-900"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-black text-lg">
                    🪑 طاولة {num}
                  </p>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${meta.badge}`}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{table.capacity ?? 4} أشخاص</p>
                {table.menu_url && (
                  <a
                    href={table.menu_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 font-bold break-all block mb-3"
                    dir="ltr"
                  >
                    {table.menu_url}
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => cycleStatus(table)}
                    className="px-3 py-1.5 rounded-lg text-xs font-black bg-slate-100 text-slate-800 hover:bg-slate-200"
                  >
                    تغيير الحالة
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const blob = await downloadTableQr(table.id, 'png');
                        downloadBlob(blob, `table-${num}-qr.png`);
                      } catch (err) {
                        showMsg(parseApiError(err, 'تعذر تحميل QR'), 'error');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-black bg-indigo-600 text-white"
                  >
                    QR
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`حذف طاولة ${num}؟`)) return;
                      try {
                        await deleteTable(table.id);
                        showMsg('تم الحذف');
                        load();
                      } catch (err) {
                        showMsg(parseApiError(err, 'تعذر الحذف'), 'error');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-black text-red-600 hover:bg-red-50"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl text-slate-900 dashboard-light-card" dir="rtl">
            <h4 className="text-xl font-black mb-4 text-slate-900">إضافة طاولة جديدة</h4>
            <form onSubmit={handleCreate} className="space-y-4 bg-white">
              <label className="block">
                <span className="text-xs font-bold text-slate-600">رقم / اسم الطاولة</span>
                <input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                  placeholder="1 أو T-01 أو VIP 1"
                  className={modalFieldClass}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">سعة الطاولة (أشخاص)</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 4)}
                  className={modalFieldClass}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-600">الحالة الأولية</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TableStatus)}
                  className={modalFieldClass}
                >
                  <option value="available" className="text-slate-900 bg-white">متاحة</option>
                  <option value="reserved" className="text-slate-900 bg-white">محجوزة</option>
                  <option value="occupied" className="text-slate-900 bg-white">مشغولة</option>
                </select>
              </label>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold border border-slate-200 text-slate-700"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl font-black bg-indigo-600 text-white disabled:opacity-60"
                >
                  {saving ? '...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
