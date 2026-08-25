interface ProgressBarProps {
  percent: number;
  className?: string;
  fillClassName?: string;
}

const ProgressBar = ({ percent, className = '', fillClassName = 'bg-accent' }: ProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={`h-2 overflow-hidden rounded-full bg-line ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-1000 ease-out ${fillClassName}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

export default ProgressBar;
