import { useEffect, useRef, useState } from 'react';

/** Counts down from `seconds` once per `start()` call; exposes remaining time. */
export const useCountdown = (seconds: number) => {
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const start = () => {
    setRemaining(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return { remaining, start, isReady: remaining === 0 };
};
