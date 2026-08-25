interface BrandMarkProps {
  name?: string;
  subLabel?: string;
  size?: number;
  showSubLabel?: boolean;
  className?: string;
}

/**
 * The Kartly-style wordmark: an ink tile with an accent dot pinned at its
 * corner, plus the brand name. `name` defaults to the storefront's own
 * brand ("ShopNow") — "Kartly" is the design kit, not the product.
 */
const BrandMark = ({ name = 'ShopNow', subLabel = 'admin', size = 28, showSubLabel = false, className = '' }: BrandMarkProps) => {
  const dotSize = Math.round(size * 0.43);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative shrink-0 rounded-[10px] bg-ink" style={{ width: size, height: size }}>
        <span
          className="absolute rounded-full bg-accent"
          style={{ width: dotSize, height: dotSize, top: -dotSize / 3, right: -dotSize / 3 }}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-extrabold tracking-[-.02em] text-ink" style={{ fontSize: size * 0.54 }}>
          {name}
        </span>
        {showSubLabel && <span className="mt-0.5 font-mono text-[9px] font-medium text-muted">{subLabel}</span>}
      </span>
    </span>
  );
};

export default BrandMark;
