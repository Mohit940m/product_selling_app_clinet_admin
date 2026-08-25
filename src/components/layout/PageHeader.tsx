import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/** The admin content header: title/subtitle left, action cluster right, stacking below `sm`. */
const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => {
  return (
    <div className="mb-6.5 flex flex-col gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-black text-[26px] leading-[1.1] tracking-[-.03em] text-ink">{title}</h1>
        {subtitle && <p className="mt-1.25 text-[12.5px] font-semibold text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5 sm:ml-auto">{actions}</div>}
    </div>
  );
};

export default PageHeader;
