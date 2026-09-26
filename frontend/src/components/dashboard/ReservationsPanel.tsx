import React, { useEffect, useState } from 'react';
import {
  fetchReservations, confirmReservation, fetchWaitlist, seatWaitlistEntry,
  type Reservation, type WaitlistEntry,
} from '../../api/reservations';
import { parseApiError } from '../../utils/apiErrors';

export const ReservationsPanel: React.FC<{ showMsg: (t: string, type?: 'success' | 'error') => void }> = ({ showMsg }) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  const load = () => {
    Promise.all([fetchReservations(), fetchWaitlist()])
      .then(([r, w]) => { setReservations(r); setWaitlist(w); })
      .catch((e) => showMsg(parseApiError(e, 'تعذر التحميل'), 'error'));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <h3 className="dashboard-section-title font-black text-slate-100 mb-4">حجوزات الطاولات</h3>
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="dashboard-light-card bg-white rounded-2xl border border-slate-200 p-4">
              <p className="font-black text-slate-900">{r.customer_name} — {r.party_size} أشخاص</p>
              <p className="text-sm text-gray-500">{new Date(r.reserved_at).toLocaleString('ar-EG')}</p>
              <p className="text-xs">{r.customer_phone}</p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-bold ${r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {r.status}
              </span>
              <div className="flex gap-2 mt-3">
                {r.status === 'pending' && (
                  <button onClick={async () => { await confirmReservation(r.id); load(); showMsg('تم التأكيد'); }} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">
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
          {reservations.length === 0 && <p className="text-slate-400 text-center py-8">لا حجوزات</p>}
        </div>
      </div>
      <div>
        <h3 className="dashboard-section-title font-black text-slate-100 mb-4">قائمة الانتظار</h3>
        <div className="space-y-3">
          {waitlist.map((w) => (
            <div key={w.id} className="dashboard-light-card bg-white rounded-2xl border border-slate-200 p-4 flex justify-between items-center">
              <div>
                <p className="font-black text-slate-900">{w.customer_name}</p>
                <p className="text-sm text-gray-500">{w.party_size} أشخاص · {w.customer_phone}</p>
              </div>
              <button onClick={async () => { await seatWaitlistEntry(w.id); load(); }} className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">
                تم الجلوس
              </button>
            </div>
          ))}
          {waitlist.length === 0 && <p className="text-slate-400 text-center py-8">لا أحد بالانتظار</p>}
        </div>
      </div>
    </div>
  );
};
