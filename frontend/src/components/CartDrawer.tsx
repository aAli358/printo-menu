import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Star, ChefHat, Tag } from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import client from '../api/client';
import { parseApiError } from '../utils/apiErrors';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, clearCart, restaurant, language, tableNumber, accessSource } = useMenuStore();
  const [loading, setLoading] = useState(false);
  const [inputTable, setInputTable] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [directOrder, setDirectOrder] = useState(false);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const totalAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handlePlaceOrder = async () => {
    if (!restaurant || cart.length === 0) return;

    const trimmedTable = (tableNumber || inputTable || '').trim();
    const useDirect = directOrder || !trimmedTable;

    setLoading(true);
    try {
      const orderData: Record<string, unknown> = {
        restaurant: restaurant.id,
        access_source: accessSource,
        items_list: cart.map(item => ({
          id: item.menuItem.id,
          quantity: item.quantity,
          price: item.totalPrice / item.quantity,
          modifiers_text: [
            item.selectedVariant ? `${t('الحجم', 'Size')}: ${t(item.selectedVariant.name, item.selectedVariant.name_en || item.selectedVariant.name)}` : '',
            item.selectedAddons.length > 0 ? `${t('الإضافات', 'Addons')}: ${item.selectedAddons.map(a => t(a.name, a.name_en || a.name)).join(', ')}` : ''
          ].filter(Boolean).join(' | ')
        })),
        ...(couponCode.trim() ? { coupon_code: couponCode.trim() } : {}),
      };
      if (!useDirect && trimmedTable) {
        orderData.table_number = trimmedTable;
      }

      const response = await client.post('orders/', orderData);
      
      setOrderSuccess(true);
      
      // If WhatsApp link exists, open it after a short delay
      if (response.data.whatsapp_link) {
        setTimeout(() => {
          window.open(response.data.whatsapp_link, '_blank');
        }, 2000);
      }

      setTimeout(() => {
        clearCart();
        setOrderSuccess(false);
        onClose();
      }, 3000);

    } catch (err: unknown) {
      const ax = err as { response?: { data?: unknown; status?: number } };
      console.error('Order submit failed:', ax.response?.status, ax.response?.data ?? err);
      alert(parseApiError(err, t('حدث خطأ أثناء إرسال الطلب', 'Error sending order')));
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
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-[430px] bottom-sheet bg-[var(--color-surface-elevated)] flex flex-col shadow-2xl"
            style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
          >
            <div className="w-10 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full mx-auto mt-3 shrink-0" />
            {orderSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: 360 }}
                  className="w-24 h-24 bg-green-500 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl"
                >
                  <ChefHat size={48} />
                </motion.div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                  {t('تم استلام طلبك!', 'Order Received!')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  {t('طلبك الآن قيد التحضير في المطبخ. شكراً لاختيارك لنا!', 'Your order is being prepared. Thank you for choosing us!')}
                </p>
                <div className="mt-12 flex flex-col items-center gap-2">
                  <div className="w-12 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-full h-full bg-green-500"
                    />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t('جاري التحويل للواتساب...', 'Redirecting to WhatsApp...')}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 btn-glow rounded-xl flex items-center justify-center text-white">
                      <ShoppingBag size={22} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-[var(--color-text)]">{t('سلة الطلبات', 'Your Order')}</h2>
                      <p className="text-xs text-neutral-500">{cart.length} {t('أصناف', 'items')}</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="touch-target p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/5">
                    <X size={22} className="text-neutral-400" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar min-h-0">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                      <div className="text-8xl mb-6">🛒</div>
                      <p className="text-xl font-black uppercase tracking-widest">{t('السلة فارغة', 'Empty Cart')}</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="flex gap-5 group relative">
                        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-[1.5rem] overflow-hidden shrink-0 shadow-inner">
                          {item.menuItem.image && (
                            <img src={item.menuItem.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h3 className="font-black text-lg text-gray-900 dark:text-white leading-tight">
                              {t(item.menuItem.name, item.menuItem.name_en || item.menuItem.name)}
                            </h3>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.selectedVariant && (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[10px] font-black text-gray-500 rounded-md uppercase">
                                {t(item.selectedVariant.name, item.selectedVariant.name_en || item.selectedVariant.name)}
                              </span>
                            )}
                            {item.selectedAddons.map(a => (
                              <span key={a.id} className="px-2 py-0.5 bg-primary/5 text-[10px] font-black text-primary rounded-md uppercase">
                                + {t(a.name, a.name_en || a.name)}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg shadow-sm text-primary font-black active:scale-90">-</button>
                              <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg shadow-sm text-primary font-black active:scale-90">+</button>
                            </div>
                            <div className="flex items-baseline gap-1">
                              <span className="font-black text-lg text-gray-900 dark:text-white">{item.totalPrice.toLocaleString()}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase">{restaurant?.currency_code}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                  <div className="p-4 border-t dark:border-gray-800 shrink-0 pb-safe">
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t('المجموع النهائي', 'Total amount')}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-gray-900 dark:text-white">{totalAmount.toLocaleString()}</span>
                          <span className="text-xs font-black text-primary uppercase">{restaurant?.currency_code}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-black text-gray-500">{t('طلب مباشر', 'Direct Order')}</span>
                      </div>
                    </div>

                    {!tableNumber && (
                      <div className="mb-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <label className="flex items-center gap-3 cursor-pointer px-1">
                          <input
                            type="checkbox"
                            checked={directOrder}
                            onChange={(e) => {
                              setDirectOrder(e.target.checked);
                              if (e.target.checked) setInputTable('');
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                            {t('طلب مباشر / بدون طاولة (سفري)', 'Direct order / no table (takeaway)')}
                          </span>
                        </label>
                        {!directOrder && (
                          <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1">
                              {t('رقم الطاولة (اختياري)', 'Table number (optional)')}
                            </label>
                            <div className="relative">
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary">
                                <Star size={20} fill="currentColor" />
                              </div>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={inputTable}
                                onChange={(e) => setInputTable(e.target.value)}
                                placeholder={t('مثال: 4', 'e.g. 4')}
                                className="w-full h-18 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary rounded-[1.5rem] px-14 font-black text-xl text-slate-900 placeholder:text-gray-500 transition-all outline-none dark:text-white shadow-inner"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mb-6">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-1 flex items-center gap-1.5">
                        <Tag size={14} /> {t('كود الخصم (اختياري)', 'Coupon code (optional)')}
                      </label>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder={t('أدخل الكوبون', 'Enter coupon')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-bold outline-none focus:ring-2 focus:ring-primary dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <button 
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="w-full h-20 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl hover:bg-primary dark:hover:bg-primary dark:hover:text-white active:scale-[0.98] transition-all disabled:opacity-50 group"
                      >
                        {loading ? (
                          <div className="w-6 h-6 border-4 border-white dark:border-gray-900 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <ChefHat size={28} className="group-hover:rotate-12 transition-transform" />
                            <span>{t('تأكيد الطلب الآن', 'Confirm Order Now')}</span>
                          </>
                        )}
                      </button>
                      
                      <p className="text-[10px] text-center text-gray-400 px-6 font-bold leading-relaxed">
                        {t('* سيتم إرسال طلبك فوراً للمطبخ وسنفتح لك تطبيق الواتساب لمتابعة الطلب مع الإدارة.', '* Your order will be sent to the kitchen and WhatsApp will open for confirmation.')}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
