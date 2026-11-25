import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * SSR-safe scroll reveal. The server render and first client render report `visible = true`,
 * so prerendered HTML always shows the content. After mount, the observer's first callback hides
 * elements that are off screen, then reveals them once they scroll into view.
 * Reduced motion: always visible.
 */
export function useRevealOnView<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return;

    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const onScreen = entry.isIntersecting;
        // Only hide on the first callback, and only if the element is below the viewport.
        if (first && !onScreen && entry.boundingClientRect.top > 0) setVisible(false);
        first = false;
        if (onScreen) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, threshold]);

  return { ref, visible };
}
