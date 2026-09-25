import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import client from '../api/client';
import { parseApiError } from '../utils/apiErrors';

interface CallWaiterButtonProps {
  hasCart?: boolean;
}

export const CallWaiterButton: React.FC<CallWaiterButtonProps> = ({ hasCart = false }) => {
  const { restaurant, language, tableNumber, accessSource } = useMenuStore();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleCall = async (type: string) => {
    if (!restaurant) return;
    setLoading(true);
    setError(null);
    try {
      await client.post('table-calls/', {
        restaurant: restaurant.id,
        table_number: tableNumber || '0',
        access_source: accessSource,
        call_type: type,
      });
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setIsOpen(false); }, 2000);
    } catch (err) {
      setError(parseApiError(err, t('تعذر إرسال الطلب', 'Could not send request')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setError(null); setIsOpen(true); }}
        aria-label="Call waiter"
        className={`fixed start-3 z-40 touch-target w-12 h-12 bg-[var(--color-surface-elevated)] rounded-2xl shadow-lg flex items-center justify-center text-primary border border-neutral-200/60 dark:border-white/10 active:scale-95 transition-transform ${hasCart ? 'mobile-fab' : 'mobile-fab-no-cart'}`}
      >
        <Bell size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-[430px] bottom-sheet bg-[var(--color-surface-elevated)] p-6 shadow-2xl"
              style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
            >
              <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mb-5" />
              {success ? (
                <div className="text-center py-4">
                  <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold">{t('تم إرسال طلبك', 'Request Sent')}</h3>
                  <p className="text-neutral-500 text-sm mt-1">{t('النادل في طريقه إليك', 'Waiter is on the way')}</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black">{t('طلب المساعدة', 'Need Help?')}</h3>
                    <button onClick={() => setIsOpen(false)} className="touch-target p-2 text-neutral-400"><X size={20} /></button>
                  </div>
                  {error && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm font-medium">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <button onClick={() => handleCall('waiter')} disabled={loading} className="w-full py-4 rounded-2xl font-bold bg-neutral-100 dark:bg-white/5 active:bg-primary active:text-white transition-colors touch-target disabled:opacity-60">
                      {t('طلب نادل', 'Call Waiter')}
                    </button>
                    <button onClick={() => handleCall('bill')} disabled={loading} className="w-full py-4 rounded-2xl font-bold bg-neutral-100 dark:bg-white/5 active:bg-primary active:text-white transition-colors touch-target disabled:opacity-60">
                      {t('طلب الفاتورة', 'Request Bill')}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
