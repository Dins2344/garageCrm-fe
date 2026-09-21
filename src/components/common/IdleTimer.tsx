import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../services/apiServices/authService';
import { LAST_ACTIVITY_KEY, IDLE_TIMEOUT_MS } from '../../utils/constants';

const CHECK_EVERY_MS = 30 * 1000;
// Any input this often also counts as writing the shared timestamp; more
// often than this is a sync localStorage write per mousemove for nothing.
const TOUCH_THROTTLE_MS = 30 * 1000;
// The server's token slides on every request. A user who types for ten
// minutes without saving makes none, so ping while active to keep it alive.
const KEEP_ALIVE_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

const lastActivity = () => Number(localStorage.getItem(LAST_ACTIVITY_KEY));

/**
 * Signs the user out after IDLE_TIMEOUT_MS without input in ANY tab. The
 * timestamp lives in localStorage so every tab reads the same clock: an
 * active tab keeps the idle ones alive, and a tab reopened after the window
 * signs out on mount. Renders nothing.
 */
const IdleTimer = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    if (lastActivity() && Date.now() - lastActivity() > IDLE_TIMEOUT_MS) {
      logout();
      return;
    }

    const touch = () => {
      const now = Date.now();
      if (now - lastActivity() > TOUCH_THROTTLE_MS) localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    };
    touch();

    let lastKeepAlive = Date.now();
    const check = () => {
      const now = Date.now();
      if (now - lastActivity() > IDLE_TIMEOUT_MS) {
        logout();
      } else if (now - lastKeepAlive > KEEP_ALIVE_MS) {
        lastKeepAlive = now;
        getMe().catch(() => logout());
      }
    };

    const interval = setInterval(check, CHECK_EVERY_MS);
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, touch, { passive: true }));
    return () => {
      clearInterval(interval);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, touch));
    };
  }, [user, logout]);

  return null;
};

export default IdleTimer;
