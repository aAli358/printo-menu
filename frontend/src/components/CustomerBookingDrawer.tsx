import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CalendarDays, Users, Clock } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { createPublicReservation, createPublicWaitlist } from '../api/reservations';

interface CustomerBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'reservation' | 'waitlist';

export const CustomerBookingDrawer: React.FC<CustomerBookingDrawerProps> = ({ isOpen, onClose }) => {
  const { language } = useMenuStore();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [tab, setTab] = useState<Tab>('reservation');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [reservedAt, setReservedAt] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setPhone('');
    setPartySize(2);
    setReservedAt('');
    setNotes('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (tab === 'reservation') {
        if (!reservedAt) {
          setError(t('اختر تاريخ ووقت الحجز', 'Pick date and time'));
          setLoading(false);
          return;
        }
        await createPublicReservation({
          customer_name: name,
          customer_phone: phone,
          party_size: partySize,
          reserved_at: new Date(reservedAt).toISOString(),
          notes,
        });
      } else {
        await createPublicWaitlist({
          customer_name: name,
          customer_phone: phone,
          party_size: partySize,
          notes,
        });
      }
      setSuccess(true);
      setTimeout(handleClose, 2500);
    } catch {
      setError(t('تعذر إرسال الطلب — تحقق من البيانات', 'Could not submit — check your details'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-[430px] bottom-sheet bg-[var(--color-surface-elevated)] flex flex-col shadow-2xl max-h-[90dvh]"
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mt-3 shrink-0" />

            {success ? (
              <div className="p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-xl font-black text-[var(--color-text)]">
                  {tab === 'reservation'
                    ? t('تم إرسال طلب الحجز!', 'Reservation request sent!')
                    : t('تمت إضافتك لقائمة الانتظار!', 'Added to waitlist!')}
                </h2>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-neutral-200/60 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 btn-glow rounded-xl flex items-center justify-center text-white">
                      <CalendarDays size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[var(--color-text)]">
                        {t('حجز طاولة', 'Book a table')}
                      </h2>
                      <p className="text-xs text-neutral-500">{t('أو انضم لقائمة الانتظار', 'Or join the waitlist')}</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleClose} className="touch-target p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5">
                    <X size={22} className="text-neutral-400" />
                  </button>
                </div>

                <div className="px-4 pt-3 flex gap-2">
                  {(['reservation', 'waitlist'] as Tab[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        tab === key ? 'btn-glow text-white' : 'bg-neutral-100 dark:bg-white/5 text-neutral-500'
                      }`}
                    >
                      {key === 'reservation' ? t('حجز', 'Reserve') : t('انتظار', 'Waitlist')}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 mb-1.5 block">{t('الاسم', 'Name')}</label>
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 mb-1.5 block">{t('الهاتف', 'Phone')}</label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 mb-1.5 flex items-center gap-1">
                      <Users size={14} /> {t('عدد الأشخاص', 'Party size')}
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={30}
                      value={partySize}
                      onChange={(e) => setPartySize(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                  {tab === 'reservation' && (
                    <div>
                      <label className="text-xs font-bold text-neutral-500 mb-1.5 flex items-center gap-1">
                        <Clock size={14} /> {t('التاريخ والوقت', 'Date & time')}
                      </label>
                      <input
                        required
                        type="datetime-local"
                        value={reservedAt}
                        onChange={(e) => setReservedAt(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-neutral-500 mb-1.5 block">{t('ملاحظات (اختياري)', 'Notes (optional)')}</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-white/10 bg-transparent outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500 text-center font-medium">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 btn-glow text-white rounded-2xl font-black disabled:opacity-50"
                  >
                    {loading ? t('جاري الإرسال...', 'Sending...') : t('إرسال الطلب', 'Submit')}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
