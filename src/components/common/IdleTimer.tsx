import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

const IDLE_TIME_LIMIT = 10 * 60 * 1000; // 10 minutes in milliseconds

const IdleTimer = () => {
  const { user, logout } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (user) {
      timeoutRef.current = setTimeout(() => {
        logout();
        // Force refresh to clear any sensitive state and redirect to login
        window.location.href = '/login?reason=session_expired';
      }, IDLE_TIME_LIMIT);
    }
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;

    // Events to track user activity
    const events = [
      'mousedown',
      // 'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, resetTimer]);

  return null; // This component doesn't render anything
};

export default IdleTimer;
