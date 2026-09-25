import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { submitExperienceReview } from '../api/menu';
import { parseApiError } from '../utils/apiErrors';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose }) => {
  const { language, restaurant, tableNumber } = useMenuStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSubmit = async () => {
    if (!restaurant) return;
    setLoading(true);
    setError(null);
    try {
      await submitExperienceReview({
        rating,
        comment: comment.trim(),
        table_number: tableNumber || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setComment('');
        setRating(5);
        onClose();
      }, 2000);
    } catch (err) {
      setError(parseApiError(err, t('تعذر إرسال التقييم', 'Could not submit rating')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden text-center"
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            {success ? (
              <div className="py-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <Star size={40} fill="currentColor" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {t('شكراً لتقييمك!', 'Thank you!')}
                </h3>
                <p className="text-gray-500 font-medium">
                  {t('رأيك يساعدنا في تقديم الأفضل دائماً.', 'Your feedback helps us improve.')}
                </p>
              </div>
            ) : (
              <>
                <button onClick={onClose} className="absolute top-6 left-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <X size={24} />
                </button>
                
                <div className="mb-8">
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Star size={32} fill="currentColor" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                    {t('كيف كانت تجربتك؟', 'Rate Your Experience')}
                  </h3>
                  <p className="text-gray-400 text-sm font-medium">
                    {t('نحن نهتم جداً برأيك لتطوير خدمتنا.', 'We value your feedback.')}
                  </p>
                </div>

                <div className="flex justify-center gap-3 mb-8">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setRating(s)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        s <= rating 
                          ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-300'
                      }`}
                    >
                      <Star size={24} fill={s <= rating ? 'currentColor' : 'none'} strokeWidth={3} />
                    </button>
                  ))}
                </div>

                <textarea 
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-2xl p-4 text-sm font-medium outline-none transition-all dark:text-white min-h-[100px] mb-6 shadow-inner"
                  placeholder={t('أضف تعليقك هنا (اختياري)...', 'Write a comment (optional)...')}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                {error && (
                  <p className="text-sm text-red-600 font-bold mb-4">{error}</p>
                )}

                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full h-16 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black flex items-center justify-center gap-3 shadow-2xl hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <Send size={20} />
                  <span>{loading ? t('جاري الإرسال...', 'Sending...') : t('إرسال التقييم', 'Submit Rating')}</span>
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
