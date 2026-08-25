import { useEffect, useRef, useState, type ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: string;
}

const COUNT_UP_MS = 600;

/** Counts up from 0 to `target` over ~600ms on mount/change. Skips the
 * animation under prefers-reduced-motion — final value renders immediately. */
const useCountUp = (target: number | null) => {
  const [display, setDisplay] = useState(target ?? 0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === null) return;

    // Reduced motion still animates, but over a single frame — this keeps
    // every update going through the same requestAnimationFrame callback
    // (never a synchronous setState in the effect body itself).
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = reduceMotion ? 0 : COUNT_UP_MS;
    const start = performance.now();

    const step = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target]);

  return display;
};

/** Replaces the old MetricCard. Delta renders only when supplied — never invent one. */
const StatCard = ({ label, value, delta }: StatCardProps) => {
  const numericTarget = typeof value === 'number' && Number.isFinite(value) ? value : null;
  const animated = useCountUp(numericTarget);

  return (
    <article className="rounded-card border border-line p-3.5 t-card lift-stat hover:border-accent hover:shadow-lift-stat sm:p-5">
      <p className="font-mono text-[10px] font-extrabold text-muted sm:text-[11px]">{label}</p>
      <p className="my-2 font-black text-[22px] leading-none tracking-[-.03em] text-ink sm:my-2.75 sm:text-[27px]">
        {numericTarget === null ? value : animated}
      </p>
      {delta && <p className="text-[11.5px] font-extrabold text-accent">{delta}</p>}
    </article>
  );
};

export default StatCard;
