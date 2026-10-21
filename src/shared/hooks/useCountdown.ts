'use client';

import { useEffect, useState } from 'react';

export type CountdownParts = {
  totalMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

export function useCountdown(targetDate: Date | null): CountdownParts {
  const [parts, setParts] = useState<CountdownParts>({
    totalMs: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    done: true,
  });

  useEffect(() => {
    if (!targetDate) {
      setParts({ totalMs: 0, hours: 0, minutes: 0, seconds: 0, done: true });
      return;
    }

    const tick = () => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      setParts({
        totalMs: diff,
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        done: diff <= 0,
      });
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [targetDate?.getTime()]);

  return parts;
}
