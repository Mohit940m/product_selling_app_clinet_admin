import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: string;
}

/** Replaces the old MetricCard. Delta renders only when supplied — never invent one. */
const StatCard = ({ label, value, delta }: StatCardProps) => {
  return (
    <article className="rounded-card border border-line p-3.5 t-card lift-stat hover:border-accent hover:shadow-lift-stat sm:p-5">
      <p className="font-mono text-[10px] font-extrabold text-muted sm:text-[11px]">{label}</p>
      <p className="my-2 font-black text-[22px] leading-none tracking-[-.03em] text-ink sm:my-2.75 sm:text-[27px]">{value}</p>
      {delta && <p className="text-[11.5px] font-extrabold text-accent">{delta}</p>}
    </article>
  );
};

export default StatCard;
