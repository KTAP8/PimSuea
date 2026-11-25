import { useSyncExternalStore } from 'react';
import { useReducedMotion } from 'framer-motion';

const noopSubscribe = () => () => {};

/**
 * Reduced-motion preference that is always `false` on the server and during hydration,
 * so prerendered markup hydrates cleanly before switching to a static variant.
 */
export function usePrefersReducedMotionAfterMount(): boolean {
  const reduced = useReducedMotion();
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return hydrated && Boolean(reduced);
}
