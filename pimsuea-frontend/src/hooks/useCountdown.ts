import { useEffect, useState } from 'react';

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function partsUntil(target: Date): CountdownParts {
  const ms = Math.max(0, target.getTime() - Date.now());
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: ms === 0,
  };
}

/** Ticks once per second until `target`. Client-only (used inside an opened dialog). */
export function useCountdown(target: Date): CountdownParts {
  const [parts, setParts] = useState(() => partsUntil(target));

  useEffect(() => {
    const id = window.setInterval(() => setParts(partsUntil(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return parts;
}
