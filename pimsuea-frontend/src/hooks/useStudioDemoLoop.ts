import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/** Stages of the hero studio demo: 0 empty → 1 logo dropped (A5) → 2 resized (3×4) → 3 hold. */
export type StudioDemoStage = 0 | 1 | 2 | 3;

const STAGE_MS: Record<StudioDemoStage, number> = { 0: 1100, 1: 1600, 2: 1400, 3: 2600 };

/**
 * Drives the looping hero demo. Server and first client render show the finished frame (3),
 * so the prerendered hero is complete. Reduced motion keeps the finished frame.
 */
export function useStudioDemoLoop(): StudioDemoStage {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<StudioDemoStage>(3);

  useEffect(() => {
    if (reduced) return;
    const t = window.setTimeout(
      () => setStage((s) => ((s + 1) % 4) as StudioDemoStage),
      STAGE_MS[stage],
    );
    return () => window.clearTimeout(t);
  }, [stage, reduced]);

  return reduced ? 3 : stage;
}
