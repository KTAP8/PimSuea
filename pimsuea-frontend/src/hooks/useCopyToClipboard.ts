import { useCallback, useEffect, useRef, useState } from 'react';

/** Copies text and exposes a short-lived `copied` flag for feedback UI. */
export function useCopyToClipboard(resetMs = 1800) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false;
      }
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), resetMs);
      return true;
    },
    [resetMs],
  );

  return { copied, copy };
}
