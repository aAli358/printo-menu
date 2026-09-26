import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, CheckCircle2, Clock, ChefHat, XCircle, RefreshCw, LogIn, Globe,
} from 'lucide-react';
import { useMenuStore } from '../store/useMenuStore';
import { useAuthStore } from '../store/useAuthStore';
import { getSubdomainSlug } from '../utils/tenant';
import { playKitchenAlert } from '../utils/sound';
import {
  fetchKitchenOrders, fetchPendingTableCalls, updateOrderStatus, resolveTableCall,
  type KitchenOrder, type KitchenTableCall, type OrderStatusFilter,
} from '../api/kitchen';
import { useKitchenSocket } from '../hooks/useKitchenSocket';

const FALLBACK_POLL_MS = 30000;

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  pending: { ar: 'انتظار', en: 'Pending', color: 'bg-amber-500' },
  preparing: { ar: 'تحضير', en: 'Preparing', color: 'bg-blue-500' },
  ready: { ar: 'جاهز', en: 'Ready', color: 'bg-emerald-500' },
  completed: { ar: 'مكتمل', en: 'Done', color: 'bg-gray-500' },
  cancelled: { ar: 'ملغى', en: 'Cancelled', color: 'bg-red-500' },
};

const CALL_LABELS: Record<string, { ar: string; en: string }> = {
  waiter: { ar: 'طلب نادل', en: 'Waiter' },
  bill: { ar: 'طلب الحساب', en: 'Bill' },
  other: { ar: 'أخرى', en: 'Other' },
};

export const KitchenDashboard: React.FC = () => {
  const { language, setLanguage } = useMenuStore();
  const authed = useAuthStore((s) => s.isAuthenticated());
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const formatTime = (date: Date | string) =>
    new Date(date).toLocaleTimeString(language === 'ar' ? 'ar-IQ' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [calls, setCalls] = useState<KitchenTableCall[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const knownOrderIds = useRef<Set<number>>(new Set());
  const knownCallIds = useRef<Set<number>>(new Set());
  const initialLoad = useRef(true);

  const tenantSlug = getSubdomainSlug();

  const poll = useCallback(async () => {
    if (!authed) return;
    try {
      const [newOrders, newCalls] = await Promise.all([
        fetchKitchenOrders(statusFilter),
        fetchPendingTableCalls(),
      ]);

      if (!initialLoad.current) {
        const freshOrders = newOrders.filter((o) => !knownOrderIds.current.has(o.id) && o.status === 'pending');
        const freshCalls = newCalls.filter((c) => !knownCallIds.current.has(c.id));
        if (freshOrders.length) playKitchenAlert('new');
        if (freshCalls.length) playKitchenAlert('call');
      }

      knownOrderIds.current = new Set(newOrders.map((o) => o.id));
      knownCallIds.current = new Set(newCalls.map((c) => c.id));
      initialLoad.current = false;

      setOrders(newOrders);
      setCalls(newCalls);
      setLastSync(new Date());
    } catch (e) {
      console.error('Kitchen poll error:', e);
    } finally {
      setLoading(false);
    }
  }, [authed, statusFilter]);

  const { connected: wsConnected } = useKitchenSocket(
    useCallback((msg) => {
      if (msg.event === 'order.created') playKitchenAlert('new');
      if (msg.event === 'table_call.created') playKitchenAlert('call');
      if (['order.created', 'order.updated', 'table_call.created', 'table_call.resolved'].includes(msg.event)) {
        poll();
      }
    }, [poll]),
    authed,
  );

  useEffect(() => {
    poll();
    const interval = setInterval(poll, wsConnected ? FALLBACK_POLL_MS : 5000);
    return () => clearInterval(interval);
  }, [poll, wsConnected]);

  const setStatus = async (orderId: number, status: string) => {
    const res = await updateOrderStatus(orderId, status);
    if (res?.whatsapp_customer_link) {
      window.open(res.whatsapp_customer_link, '_blank', 'noopener,noreferrer');
    }
    poll();
  };

  const resolveCall = async (callId: number) => {
    await resolveTableCall(callId);
    poll();
  };

  const nextAction = (status: string): { label: string; next: string; icon: React.ReactNode } | null => {
    if (status === 'pending') return { label: t('بدء التحضير', 'Start Prep'), next: 'preparing', icon: <ChefHat size={18} /> };
    if (status === 'preparing') return { label: t('جاهز للتسليم', 'Mark Ready'), next: 'ready', icon: <CheckCircle2 size={18} /> };
    if (status === 'ready') return { label: t('تم التسليم', 'Complete'), next: 'completed', icon: <CheckCircle2 size={18} /> };
    return null;
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8 text-center" dir="rtl">
        <ChefHat size={64} className="text-indigo-400 mb-6" />
        <h1 className="text-3xl font-black mb-3">{t('نظام المطبخ', 'Kitchen Display')}</h1>
        <p className="text-slate-400 mb-8 max-w-md">
          {t('يجب تسجيل الدخول لعرض الطلبات الحية.', 'Sign in to view live orders.')}
          {tenantSlug && (
            <span className="block mt-2 text-indigo-300 font-bold">{tenantSlug}</span>
          )}
        </p>
        <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 rounded-2xl font-black">
          <LogIn size={20} /> {t('تسجيل الدخول', 'Sign In')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-[1800px] mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl">👨‍🍳</div>
            <div>
              <h1 className="text-xl font-black">{t('شاشة المطبخ', 'Kitchen Display')}</h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                {wsConnected
                  ? t('متصل مباشرة — WebSocket', 'Live — WebSocket')
                  : t('تحديث كل 5 ث (Polling)', 'Refresh 5s (Polling)')}
                {' · '}{formatTime(lastSync)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled'] as OrderStatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {s === 'all' ? t('الكل', 'All') : (STATUS_LABELS[s]?.[language === 'ar' ? 'ar' : 'en'] ?? s)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700 flex items-center gap-1.5"
              aria-label={t('اللغة', 'Language')}
            >
              <Globe size={14} />
              {language === 'ar' ? 'EN' : 'عربي'}
            </button>
            <button
              type="button"
              onClick={poll}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700"
              title={t('تحديث', 'Refresh')}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <Link to="/dashboard" className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold hover:bg-slate-700">
              {t('لوحة التحكم', 'Dashboard')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-4 grid lg:grid-cols-4 gap-4">
        {/* Table calls sidebar */}
        <aside className="lg:col-span-1 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} className="text-amber-400" />
            <h2 className="font-black">{t('طلبات الطاولات', 'Table Calls')}</h2>
            {calls.length > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-black text-xs font-black rounded-full">{calls.length}</span>
            )}
          </div>
          {calls.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center border border-dashed border-slate-700 rounded-2xl">
              {t('لا طلبات', 'No calls')}
            </p>
          ) : (
            calls.map((call) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
              >
                <p className="text-2xl font-black text-amber-300">{t('طاولة', 'Table')} {call.table_number}</p>
                <p className="text-sm text-amber-200/80 mt-1">
                  {CALL_LABELS[call.call_type]?.[language === 'ar' ? 'ar' : 'en'] ?? call.call_type}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatTime(call.created_at)}
                </p>
                <button
                  onClick={() => resolveCall(call.id)}
                  className="mt-3 w-full py-2 bg-amber-500 text-black rounded-xl text-sm font-black"
                >
                  {t('تمت الاستجابة', 'Resolved')}
                </button>
              </motion.div>
            ))
          )}
        </aside>

        {/* Orders grid */}
        <section className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg">
              {t('الطلبات', 'Orders')} ({orders.length})
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-slate-700 rounded-3xl text-slate-500">
              <p className="text-5xl mb-4">💤</p>
              <p className="font-bold">{t('لا طلبات في هذه الفئة', 'No orders in this filter')}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {orders.map((order) => {
                  const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
                  const action = nextAction(order.status);
                  return (
                    <motion.article
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col"
                    >
                      <div className={`h-1.5 ${st.color}`} />
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${st.color} text-white mb-2`}>
                              {st[language === 'ar' ? 'ar' : 'en']}
                            </span>
                            <h3 className="text-3xl font-black">
                              {t('طاولة', 'T')} {order.table_number || '—'}
                            </h3>
                            <p className="text-xs text-slate-500">#{order.id}</p>
                          </div>
                          <div className="text-right text-sm text-slate-400 flex items-center gap-1">
                            <Clock size={14} />
                            {formatTime(order.created_at)}
                          </div>
                        </div>

                        <ul className="space-y-3 mb-4">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex gap-3">
                              <span className="w-8 h-8 bg-indigo-600/20 text-indigo-300 rounded-lg flex items-center justify-center font-black shrink-0">
                                {item.quantity}
                              </span>
                              <div>
                                <p className="font-bold text-sm">{item.menu_item_name}</p>
                                {item.modifiers_text && (
                                  <p className="text-xs text-slate-500">{item.modifiers_text}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>

                        <p className="text-lg font-black text-indigo-300">{order.total_amount.toLocaleString()}</p>
                      </div>

                      <div className="p-4 pt-0 flex flex-col gap-2">
                        {action && (
                          <button
                            onClick={() => setStatus(order.id, action.next)}
                            className="w-full py-3 bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-500 hover:text-white transition-colors"
                          >
                            {action.icon} {action.label}
                          </button>
                        )}
                        {!['completed', 'cancelled'].includes(order.status) && (
                          <button
                            onClick={() => setStatus(order.id, 'cancelled')}
                            className="w-full py-2 text-red-400 text-sm font-bold flex items-center justify-center gap-1 hover:bg-red-500/10 rounded-xl"
                          >
                            <XCircle size={16} /> {t('إلغاء', 'Cancel')}
                          </button>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
