import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  delta?: string;
}

/** Replaces the old MetricCard. Delta renders only when supplied — never invent one. */
const StatCard = ({ label, value, delta }: StatCardProps) => {
  return (
    <article className="rounded-card border border-line p-5 t-card lift-stat hover:border-accent hover:shadow-lift-stat">
      <p className="font-mono text-[11px] font-extrabold text-muted">{label}</p>
      <p className="my-2.75 font-black text-[27px] leading-none tracking-[-.03em] text-ink">{value}</p>
      {delta && <p className="text-[11.5px] font-extrabold text-accent">{delta}</p>}
    </article>
  );
};

export default StatCard;
