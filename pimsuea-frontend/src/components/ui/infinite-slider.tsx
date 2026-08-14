import { cn } from "@/lib/utils";
import { useMotionValue, animate, motion } from "framer-motion";
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import useMeasure from "react-use-measure";

type InfiniteSliderProps = {
  children: React.ReactNode;
  gap?: number;
  duration?: number;
  durationOnHover?: number;
  speed?: number;
  speedOnHover?: number;
  direction?: "horizontal" | "vertical";
  reverse?: boolean;
  className?: string;
};

export function InfiniteSlider({
  children,
  gap = 16,
  duration = 25,
  durationOnHover,
  speed,
  speedOnHover,
  direction = "horizontal",
  reverse = false,
  className,
}: InfiniteSliderProps) {
  const [containerRef, { width: containerWidth, height: containerHeight }] =
    useMeasure();
  const [setRef, { width: setWidth, height: setHeight }] = useMeasure();
  const translation = useMotionValue(0);
  const controlsRef = useRef<ReturnType<typeof animate> | null>(null);

  const childItems = useMemo(() => Children.toArray(children), [children]);

  const repeatCount = useMemo(() => {
    const viewport =
      direction === "horizontal" ? containerWidth : containerHeight;
    const setSize = direction === "horizontal" ? setWidth : setHeight;
    if (setSize <= 0 || viewport <= 0) return 4;
    return Math.max(4, Math.ceil(viewport / setSize) + 2);
  }, [containerWidth, containerHeight, setWidth, setHeight, direction]);

  const repeatedItems = useMemo(
    () => Array.from({ length: repeatCount }, () => childItems).flat(),
    [childItems, repeatCount],
  );

  const [trackRef, { width: trackWidth, height: trackHeight }] = useMeasure();
  const size = direction === "horizontal" ? trackWidth : trackHeight;
  const contentSize = size + gap;

  const resolveDuration = (value: number | undefined, fallback: number) => {
    if (value === undefined) return fallback;
    if (speed !== undefined && contentSize > 0) {
      return contentSize / value;
    }
    return value;
  };

  const baseDuration = resolveDuration(speed, duration);
  const hoverDuration = resolveDuration(speedOnHover, durationOnHover ?? duration);

  const stopAnimation = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const startLoop = useCallback(
    (loopDuration: number, resumeFrom?: number) => {
      if (contentSize <= 0) return;

      const from = reverse ? -contentSize / 2 : 0;
      const to = reverse ? 0 : -contentSize / 2;
      const segment = Math.abs(to - from);

      stopAnimation();

      const begin = resumeFrom ?? from;
      if (resumeFrom === undefined) {
        translation.set(from);
      }

      const remaining = Math.abs(to - begin);
      const finishCurrentSegment = remaining > 0 && begin !== to;

      const runInfiniteLoop = () => {
        translation.set(from);
        controlsRef.current = animate(translation, [from, to], {
          ease: "linear",
          duration: loopDuration,
          repeat: Infinity,
          repeatType: "loop",
          repeatDelay: 0,
          onRepeat: () => {
            translation.set(from);
          },
        });
      };

      if (finishCurrentSegment) {
        controlsRef.current = animate(translation, [begin, to], {
          ease: "linear",
          duration: loopDuration * (remaining / segment),
          onComplete: runInfiniteLoop,
        });
      } else {
        runInfiniteLoop();
      }
    },
    [contentSize, reverse, stopAnimation, translation],
  );

  useEffect(() => {
    startLoop(baseDuration);
    return stopAnimation;
  }, [baseDuration, contentSize, reverse, repeatCount, startLoop, stopAnimation]);

  const hoverProps =
    durationOnHover !== undefined || speedOnHover !== undefined
      ? {
          onHoverStart: () => startLoop(hoverDuration, translation.get()),
          onHoverEnd: () => startLoop(baseDuration, translation.get()),
        }
      : {};

  const renderItems = (items: React.ReactNode[], keyPrefix: string) =>
    items.map((item, index) =>
      isValidElement(item)
        ? cloneElement(item, { key: `${keyPrefix}-${index}` })
        : item,
    );

  return (
    <div ref={containerRef} className={cn("w-full overflow-hidden", className)}>
      <div
        ref={setRef}
        aria-hidden
        className={cn(
          "pointer-events-none invisible absolute flex w-max",
          direction === "horizontal" ? "flex-row" : "flex-col",
        )}
        style={{ gap: `${gap}px` }}
      >
        {renderItems(childItems, "measure")}
      </div>

      <motion.div
        className="flex w-max"
        style={{
          ...(direction === "horizontal"
            ? { x: translation }
            : { y: translation }),
          gap: `${gap}px`,
          flexDirection: direction === "horizontal" ? "row" : "column",
        }}
        ref={trackRef}
        {...hoverProps}
      >
        {renderItems(repeatedItems, "a")}
        {renderItems(repeatedItems, "b")}
      </motion.div>
    </div>
  );
}
