type ShimmerProps = {
  className?: string;
};

/**
 * The skeleton block from the Kartly design-system panel: a moving gradient
 * sweep (`kfShim`) instead of a flat pulsing block. Replaces `animate-pulse`.
 */
const Shimmer = ({ className = 'h-4 w-full rounded-btn' }: ShimmerProps) => {
  return (
    <div
      className={`animate-shim bg-line ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, var(--k-line) 25%, var(--k-soft2) 50%, var(--k-line) 75%)',
        backgroundSize: '260px 100%',
      }}
      aria-hidden="true"
    />
  );
};

export default Shimmer;
