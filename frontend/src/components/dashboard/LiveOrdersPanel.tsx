import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, CheckCircle2, RefreshCw, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { playKitchenAlert } from '../../utils/sound';
import { useKitchenSocket } from '../../hooks/useKitchenSocket';
import {
  fetchKitchenOrders, fetchPendingTableCalls, updateOrderStatus, resolveTableCall,
  type KitchenOrder, type KitchenTableCall, type OrderStatusFilter,
} from '../../api/kitchen';

const FALLBACK_POLL_MS = 30000;

const STATUS_AR: Record<string, string> = {
  pending: 'انتظار',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  completed: 'تم التسليم',
  cancelled: 'ملغى',
};

export const LiveOrdersPanel: React.FC = () => {
  const role = useAuthStore((s) => s.user?.tenant_role);
  const hidePrices = role === 'kitchen';
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [calls, setCalls] = useState<KitchenTableCall[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const knownOrderIds = useRef<Set<number>>(new Set());
  const initialLoad = useRef(true);

  const poll = useCallback(async () => {
    try {
      const [newOrders, newCalls] = await Promise.all([
        fetchKitchenOrders(statusFilter),
        fetchPendingTableCalls(),
      ]);

      if (!initialLoad.current) {
        const fresh = newOrders.filter((o) => !knownOrderIds.current.has(o.id) && o.status === 'pending');
        if (fresh.length) playKitchenAlert('new');
      }
      knownOrderIds.current = new Set(newOrders.map((o) => o.id));
      initialLoad.current = false;

      setOrders(newOrders);
      setCalls(newCalls);
      setLastSync(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const { connected: wsConnected } = useKitchenSocket(
    useCallback((msg) => {
      if (msg.event === 'order.created') playKitchenAlert('new');
      if (['order.created', 'order.updated', 'table_call.created', 'table_call.resolved'].includes(msg.event)) {
        poll();
      }
    }, [poll]),
    true,
  );

  useEffect(() => {
    poll();
    const interval = setInterval(poll, wsConnected ? FALLBACK_POLL_MS : 5000);
    return () => clearInterval(interval);
  }, [poll, wsConnected]);

  const advanceStatus = async (orderId: number, next: string) => {
    const res = await updateOrderStatus(orderId, next);
    const link = res?.whatsapp_customer_link as string | null | undefined;
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
    poll();
  };

  const nextStep = (status: string): { label: string; next: string } | null => {
    if (status === 'pending') return { label: 'بدء التحضير ⏳', next: 'preparing' };
    if (status === 'preparing') return { label: 'جاهز للتسليم', next: 'ready' };
    if (status === 'ready') return { label: 'تم التسليم ✅', next: 'completed' };
    return null;
  };

  const cardClass = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm text-slate-900';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">الطلبات الحية</h2>
          <p className="text-xs text-slate-400 mt-1">
            {wsConnected ? '🟢 متصل — تنبيه فوري' : '🟡 استطلاع دوري'} · آخر تحديث {lastSync.toLocaleTimeString('ar-IQ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => poll()} className="px-3 py-2 rounded-xl bg-white/10 text-sm font-bold text-slate-200 flex items-center gap-2">
            <RefreshCw size={16} /> تحديث
          </button>
          <Link to="/kitchen" className="px-3 py-2 rounded-xl bg-indigo-600 text-sm font-black text-white flex items-center gap-2">
            <ChefHat size={16} /> شاشة المطبخ
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'preparing', 'ready'] as OrderStatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-black ${
              statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'
            }`}
          >
            {s === 'all' ? 'الكل' : STATUS_AR[s]}
          </button>
        ))}
      </div>

      {calls.length > 0 && (
        <div className={cardClass}>
          <h3 className="font-black text-slate-900 mb-3">طاولات تطلب النادل</h3>
          <ul className="space-y-2">
            {calls.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
                <span className="font-bold">طاولة {c.table_number}</span>
                <button
                  type="button"
                  onClick={() => resolveTableCall(c.id).then(poll)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black"
                >
                  تمت المعالجة
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && orders.length === 0 ? (
        <p className="text-slate-400 text-center py-12">جاري التحميل...</p>
      ) : orders.length === 0 ? (
        <p className="text-slate-500 text-center py-16">لا توجد طلبات حالياً</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const step = nextStep(order.status);
            return (
              <div key={order.id} className={cardClass}>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <div>
                    <p className="text-lg font-black text-slate-900">#{order.id}</p>
                    <p className="text-sm text-slate-600">طاولة {order.table_number || '—'}</p>
                    {order.customer_name && <p className="text-xs text-slate-500">{order.customer_name}</p>}
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-slate-100 text-xs font-black text-slate-800">
                    {STATUS_AR[order.status] || order.status}
                  </span>
                </div>
                <ul className="text-sm text-slate-800 space-y-1 mb-3">
                  {order.items.map((it) => (
                    <li key={it.id} className="flex justify-between gap-2">
                      <span>{it.quantity}× {it.menu_item_name}</span>
                      {!hidePrices && <span className="text-slate-500">{it.price}</span>}
                    </li>
                  ))}
                </ul>
                {!hidePrices && (
                  <p className="text-sm font-black text-indigo-700 mb-3">المجموع: {order.total_amount}</p>
                )}
                {step && (
                  <button
                    type="button"
                    onClick={() => advanceStatus(order.id, step.next)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-600 text-white text-sm font-black flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    {step.label}
                  </button>
                )}
                {order.customer_phone && (
                  <a
                    href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 w-full py-2 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-black flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={16} /> واتساب الزبون
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
