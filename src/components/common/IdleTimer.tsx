import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const IDLE_TIME_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds
const ACTIVITY_EVENTS = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];

/** Signs the user out after IDLE_TIME_LIMIT without any input. Renders nothing. */
const IdleTimer = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
        // Force refresh to clear any sensitive state and redirect to login
        window.location.href = '/login?reason=session_expired';
      }, IDLE_TIME_LIMIT);
    };
    reset();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, reset));
    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, reset));
    };
  }, [user, logout]);

  return null;
};

export default IdleTimer;
