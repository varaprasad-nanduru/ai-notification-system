import { useCallback, useEffect, useRef, useState } from 'react';
import { Notification, WSMessage } from '../types';

const CLIENT_ID = `client_${Math.random().toString(36).slice(2, 9)}`;
const WS_URL = `ws://localhost:8000/ws/${CLIENT_ID}`;

export interface UseWebSocketReturn {
  notifications: Notification[];
  isConnected: boolean;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const connect = useCallback(() => {
    if (unmountedRef.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };

    ws.onmessage = (event: MessageEvent) => {
      const msg: WSMessage = JSON.parse(event.data as string);
      setNotifications(prev => {
        switch (msg.type) {
          case 'initial':
            return msg.data;
          case 'new':
            return [msg.data, ...prev];
          case 'update':
            return prev.map(n => (n.id === msg.data.id ? msg.data : n));
          case 'delete':
            return prev.filter(n => n.id !== msg.data.id);
          default:
            return prev;
        }
      });
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (!unmountedRef.current) {
        reconnectRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    // Reset on every mount so React StrictMode's simulated unmount+remount
    // doesn't leave unmountedRef permanently true and break the reconnect loop.
    unmountedRef.current = false;
    connect();
    return () => {
      unmountedRef.current = true;
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const markRead = useCallback((id: string) => send({ type: 'mark_read', id }), [send]);
  const markUnread = useCallback((id: string) => send({ type: 'mark_unread', id }), [send]);

  return { notifications, isConnected, markRead, markUnread };
}
