import { useEffect, useRef, useState, useCallback } from "react";

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_EVENTS: (keyof DocumentEventMap)[] = [
  "mousemove",
  "keydown",
  "click",
  "scroll",
  "touchstart",
];

interface UseAutoLockOptions {
  onLock: () => void;
}

interface UseAutoLockReturn {
  resetTimer: () => void;
  remainingSeconds: number;
}

export function useAutoLock({ onLock }: UseAutoLockOptions): UseAutoLockReturn {
  const [remainingSeconds, setRemainingSeconds] = useState(LOCK_TIMEOUT_MS / 1000);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const onLockRef = useRef(onLock);

  // Keep the onLock ref updated to avoid stale closures
  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingSeconds(LOCK_TIMEOUT_MS / 1000);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onLockRef.current();
    }, LOCK_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    // Start the lock timeout
    resetTimer();

    // Update remaining seconds every second
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((LOCK_TIMEOUT_MS - elapsed) / 1000));
      setRemainingSeconds(remaining);
    }, 1000);

    // Listen for activity events
    const handleActivity = () => {
      resetTimer();
    };

    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, handleActivity);
      }
    };
  }, [resetTimer]);

  return { resetTimer, remainingSeconds };
}
