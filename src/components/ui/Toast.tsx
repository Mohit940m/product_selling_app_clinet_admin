interface ToastProps {
  title: string;
  sub?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** The dark inline toast from the Kartly design-system panel. */
const Toast = ({ title, sub, actionLabel, onAction }: ToastProps) => {
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-ink px-4 py-4 text-card">
      <span className="h-6 w-6 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-extrabold">{title}</p>
        {sub && <p className="mt-0.5 truncate text-[11px] font-medium opacity-70">{sub}</p>}
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 text-[11px] font-extrabold text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default Toast;
export type { ToastProps };
