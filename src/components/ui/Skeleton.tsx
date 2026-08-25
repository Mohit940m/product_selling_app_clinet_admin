import Shimmer from '../motion/Shimmer';

type SkeletonPreset = 'line' | 'block' | 'card' | 'row';

interface SkeletonProps {
  preset?: SkeletonPreset;
  className?: string;
}

const PRESET_CLASSES: Record<SkeletonPreset, string> = {
  line: 'h-4 w-full rounded-btn',
  block: 'h-24 w-full rounded-card',
  card: 'h-52 w-full rounded-card',
  row: 'h-14 w-full rounded-btn',
};

const Skeleton = ({ preset = 'line', className }: SkeletonProps) => {
  return <Shimmer className={className ?? PRESET_CLASSES[preset]} />;
};

export default Skeleton;
