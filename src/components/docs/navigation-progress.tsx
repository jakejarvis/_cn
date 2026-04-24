import { useRouter } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { cn } from "@/lib/utils";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function clearTimer(timer: React.RefObject<ReturnType<typeof setTimeout> | undefined>) {
  clearTimeout(timer.current);
}

function clearIntervalTimer(timer: React.RefObject<ReturnType<typeof setInterval> | undefined>) {
  clearInterval(timer.current);
}

export function NavigationProgress({ className }: { className?: string }) {
  const router = useRouter();

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const isNavigatingRef = useRef(false);
  const hasShownRef = useRef(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const trickleTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearTimers = useEffectEvent(() => {
    clearTimer(showTimerRef);
    clearIntervalTimer(trickleTimerRef);
    clearTimer(finishTimerRef);
    clearTimer(resetTimerRef);
    clearTimer(safetyTimerRef);
  });

  const start = useEffectEvent(() => {
    if (isNavigatingRef.current) return;

    isNavigatingRef.current = true;
    hasShownRef.current = false;
    clearTimers();

    showTimerRef.current = setTimeout(() => {
      hasShownRef.current = true;
      setVisible(true);
      setProgress(8);

      trickleTimerRef.current = setInterval(() => {
        setProgress((currentProgress) => {
          if (!isNavigatingRef.current) return currentProgress;

          return clamp(currentProgress + Math.max(0.5, (90 - currentProgress) * 0.08), 0, 90);
        });
      }, 200);
    }, 120);

    safetyTimerRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
      hasShownRef.current = false;
      clearTimers();
      setVisible(false);
      setProgress(0);
    }, 12_000);
  });

  const done = useEffectEvent(() => {
    if (!isNavigatingRef.current) return;

    isNavigatingRef.current = false;
    clearTimers();

    if (!hasShownRef.current) {
      hasShownRef.current = false;
      setVisible(false);
      setProgress(0);
      return;
    }

    hasShownRef.current = false;
    setVisible(true);
    setProgress(100);

    finishTimerRef.current = setTimeout(() => {
      setVisible(false);
      resetTimerRef.current = setTimeout(() => setProgress(0), 200);
    }, 200);
  });

  useEffect(() => {
    const unsubscribeBeforeLoad = router.subscribe("onBeforeLoad", (event) => {
      if (event.pathChanged) start();
    });
    const unsubscribeResolved = router.subscribe("onResolved", () => done());

    return () => {
      unsubscribeBeforeLoad();
      unsubscribeResolved();
    };
  }, [router]);

  useEffect(() => {
    return () => clearTimers();
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[10000] h-0.5 transition-opacity duration-200 ease-out motion-reduce:transition-none",
        className,
      )}
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full origin-left bg-primary shadow-[0_0_8px_var(--primary)] transition-transform duration-150 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${clamp(progress, 0, 100) / 100})` }}
      />
    </div>
  );
}
