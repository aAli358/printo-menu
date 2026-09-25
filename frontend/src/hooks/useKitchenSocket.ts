import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { getSubdomainSlug, getTenantSlugFromUrl } from '../utils/tenant';

export type KitchenWsEvent =
  | 'connected'
  | 'pong'
  | 'order.created'
  | 'order.updated'
  | 'table_call.created'
  | 'table_call.resolved';

export interface KitchenWsMessage {
  event: KitchenWsEvent;
  payload: Record<string, unknown>;
}

const RECONNECT_MS = 3000;
const PING_MS = 25000;

function buildKitchenWsUrl(token: string, tenant: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const params = new URLSearchParams({ token, tenant });
  return `${protocol}//${window.location.host}/ws/kitchen/?${params.toString()}`;
}

export function useKitchenSocket(onEvent: (msg: KitchenWsMessage) => void, enabled: boolean) {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const pingTimer = useRef<number | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const cleanup = useCallback(() => {
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (pingTimer.current) {
      window.clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = useAuthStore.getState().accessToken;
    const tenant = getSubdomainSlug() || getTenantSlugFromUrl() || useAuthStore.getState().restaurants[0]?.slug;
    if (!token || !tenant) return;

    cleanup();

    const ws = new WebSocket(buildKitchenWsUrl(token, tenant));
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      pingTimer.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, PING_MS);
    };

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as KitchenWsMessage;
        if (data.event !== 'pong') onEventRef.current(data);
      } catch {
        /* ignore malformed frames */
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingTimer.current) {
        window.clearInterval(pingTimer.current);
        pingTimer.current = null;
      }
      if (enabled) {
        reconnectTimer.current = window.setTimeout(connect, RECONNECT_MS);
      }
    };

    ws.onerror = () => ws.close();
  }, [cleanup, enabled]);

  useEffect(() => {
    if (enabled) connect();
    else cleanup();
    return cleanup;
  }, [connect, cleanup, enabled]);

  return { connected };
}
