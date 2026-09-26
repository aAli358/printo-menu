import React, { useEffect, useState } from 'react';
import {
  fetchReservations, confirmReservation, fetchWaitlist, seatWaitlistEntry,
  type Reservation, type WaitlistEntry,
} from '../../api/reservations';
import { parseApiError } from '../../utils/apiErrors';
import { TablesManagementSection } from './TablesManagementSection';

type SubTab = 'tables' | 'reservations' | 'waitlist';

const SUB_TABS: { id: SubTab; label: string; icon: string }[] = [
  { id: 'tables', label: 'إدارة الطاولات', icon: '🪑' },
  { id: 'reservations', label: 'حجوزات الطاولات', icon: '📅' },
  { id: 'waitlist', label: 'قائمة الانتظار', icon: '⏳' },
];

export const ReservationsPanel: React.FC<{ showMsg: (t: string, type?: 'success' | 'error') => void }> = ({ showMsg }) => {
  const [subTab, setSubTab] = useState<SubTab>('tables');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  const loadBookings = () => {
    Promise.all([fetchReservations(), fetchWaitlist()])
      .then(([r, w]) => { setReservations(r); setWaitlist(w); })
      .catch((e) => showMsg(parseApiError(e, 'تعذر التحميل'), 'error'));
  };

  useEffect(() => {
    if (subTab !== 'tables') loadBookings();
  }, [subTab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubTab(tab.id)}
            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-sm font-black transition-all ${
              subTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {subTab === 'tables' && <TablesManagementSection showMsg={showMsg} />}

      {subTab === 'reservations' && (
        <div>
          <h3 className="dashboard-section-title font-black text-slate-100 mb-4">حجوزات الزبائن</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {reservations.map((r) => (
              <div key={r.id} className="dashboard-light-card bg-white rounded-2xl border border-slate-200 p-4">
                <p className="font-black text-slate-900">{r.customer_name} — {r.party_size} أشخاص</p>
                <p className="text-sm text-gray-500">{new Date(r.reserved_at).toLocaleString('ar-EG')}</p>
                <p className="text-xs text-slate-600">{r.customer_phone}</p>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold ${r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status}
                </span>
                <div className="flex gap-2 mt-3">
                  {r.status === 'pending' && (
                    <button
                      type="button"
                      onClick={async () => { await confirmReservation(r.id); loadBookings(); showMsg('تم التأكيد'); }}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                    >
                      تأكيد
                    </button>
                  )}
                  {r.whatsapp_link && (
                    <a href={r.whatsapp_link} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
            {reservations.length === 0 && <p className="text-slate-400 text-center py-8 col-span-full">لا حجوزات</p>}
          </div>
        </div>
      )}

      {subTab === 'waitlist' && (
        <div>
          <h3 className="dashboard-section-title font-black text-slate-100 mb-4">قائمة الانتظار</h3>
          <div className="space-y-3 max-w-2xl">
            {waitlist.map((w) => (
              <div key={w.id} className="dashboard-light-card bg-white rounded-2xl border border-slate-200 p-4 flex justify-between items-center gap-4">
                <div>
                  <p className="font-black text-slate-900">{w.customer_name}</p>
                  <p className="text-sm text-gray-500">{w.party_size} أشخاص · {w.customer_phone}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => { await seatWaitlistEntry(w.id); loadBookings(); showMsg('تم تسجيل الجلوس'); }}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shrink-0"
                >
                  تم الجلوس
                </button>
              </div>
            ))}
            {waitlist.length === 0 && <p className="text-slate-400 text-center py-8">لا أحد بالانتظار</p>}
          </div>
        </div>
      )}
    </div>
  );
};
