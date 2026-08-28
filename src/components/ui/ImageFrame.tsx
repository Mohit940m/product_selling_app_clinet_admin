import { useState } from 'react';

interface ImageFrameProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  rounded?: string;
}

/**
 * Universal image slot: falls back to the hatched "product shot"
 * placeholder when `src` is missing, or when it fails to load (e.g. a
 * deleted Cloudinary asset, a broken URL) — not just when it's absent.
 */
const ImageFrame = ({ src, alt, className = '', imgClassName = '', rounded = '' }: ImageFrameProps) => {
  const [failed, setFailed] = useState(false);
  // Tracks the src this `failed` flag applies to, so a change in src can
  // be caught and reset during render — React's own recommended pattern
  // for "adjust state when a prop changes" (avoids the extra render an
  // effect-based reset would cost, and this repo's react-hooks/
  // set-state-in-effect rule specifically disallows the effect version).
  const [failedSrc, setFailedSrc] = useState(src);
  if (src !== failedSrc) {
    setFailedSrc(src);
    if (failed) setFailed(false);
  }

  if (!src || failed) {
    return (
      <div className={`bg-hatch flex items-center justify-center ${rounded} ${className}`}>
        <span className="font-mono text-[9px] font-medium text-muted" aria-hidden="true">
          product shot
        </span>
        <span className="sr-only">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`group overflow-hidden ${rounded} ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover t-slow group-hover:scale-105 ${imgClassName}`}
      />
    </div>
  );
};

export default ImageFrame;
