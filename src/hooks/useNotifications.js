import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../api/services';
import { unwrapApiData } from '../api/unwrap';
import { buildWsUrl } from '../utils/ws';

export function useNotifications(userId) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshCount = useCallback(() => {
    if (!userId) return Promise.resolve();
    return notificationAPI
      .getUnreadCount()
      .then((response) => {
        const data = unwrapApiData(response);
        const count =
          typeof data === 'number'
            ? data
            : data?.count ?? data?.unreadCount ?? 0;
        setUnreadCount(Number(count) || 0);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (!userId) return undefined;
    const token = localStorage.getItem('accessToken');
    if (!token) return undefined;

    const ws = new WebSocket(buildWsUrl(`/ws/notifications/${userId}`, token));

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === 'notification_created') {
          setUnreadCount((c) => c + 1);
        }
      } catch {
        /* ignore */
      }
    };

    return () => ws.close();
  }, [userId]);

  return { unreadCount, setUnreadCount, refreshCount };
}
