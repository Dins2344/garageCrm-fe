import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bell } from 'lucide-react';
import Loader from '../Loader';
import { useAuth } from '../../context/AuthContext';
import { useGarage } from '../../context/GarageContext';
import {
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead,
} from '../../services/apiServices/notificationService';
import { ACTIVE_GARAGE_KEY, NOTIFICATION_POLL_MS, NOTIFICATIONS_CHANGED_EVENT } from '../../utils/constants';
import type { AppNotification } from '../../types/models';

const LIST_SIZE = 20;

/**
 * The header bell. Polls the unread count while the tab is visible — web has
 * no push — and re-reads it on focus and whenever this tab changes something.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const { activeGarageId, switchGarage } = useGarage();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[] | null>(null);

  const refreshCount = useCallback(() => {
    if (document.visibilityState !== 'visible') return;
    // A poll never toasts: the bell is a convenience, not something to nag about.
    getUnreadCount().then(setCount).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const timer = window.setInterval(refreshCount, NOTIFICATION_POLL_MS);
    window.addEventListener('focus', refreshCount);
    document.addEventListener('visibilitychange', refreshCount);
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshCount);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshCount);
      document.removeEventListener('visibilitychange', refreshCount);
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refreshCount);
    };
  }, [refreshCount]);

  const toggle = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setItems(null);
    try {
      setItems((await getNotifications({ limit: LIST_SIZE })).data);
    } catch {
      setItems([]);
    }
  };

  const openItem = (n: AppNotification) => {
    setOpen(false);
    if (!n.readAt) markNotificationRead(n._id).then(refreshCount).catch(() => {});
    // A request lives in one branch. An owner looking at another must switch
    // first, or the request answers 404. Compare with the branch the API client
    // actually sends, which is what the stored key holds.
    let current = activeGarageId;
    try { current = localStorage.getItem(ACTIVE_GARAGE_KEY) ?? activeGarageId; } catch { /* storage blocked */ }
    if (user?.role === 'owner' && n.garage !== current) switchGarage(n.garage);
    if (n.entityType === 'change_request') navigate(`/requests?id=${n.entity}`);
  };

  const readAll = async () => {
    try {
      await markAllNotificationsRead();
      const now = new Date().toISOString();
      setItems(prev => prev?.map(n => ({ ...n, readAt: n.readAt ?? now })) ?? null);
      setCount(0);
    } catch {
      toast.error('Failed to mark notifications read');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={count ? `Notifications, ${count} unread` : 'Notifications'}
        aria-expanded={open}
        className="relative flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-bone-200 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span aria-hidden="true" className="tabular absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-danger text-white text-[11px] font-bold leading-[18px] text-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-label="Notifications" className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-bone-50 border border-bone-200 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-bone-200">
              <span className="font-bold text-gray-900">Notifications</span>
              <button type="button" onClick={readAll} className="text-xs font-bold text-primary-600 hover:text-primary-700">
                Mark all read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items === null ? (
                <div className="p-6"><Loader /></div>
              ) : items.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 text-center">No notifications yet</p>
              ) : items.map(n => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-bone-200 hover:bg-bone-100 ${n.readAt ? '' : 'bg-primary-50'}`}
                >
                  <span className="block text-sm font-bold text-gray-900">{n.title}</span>
                  <span className="block text-sm text-gray-700">{n.body}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
