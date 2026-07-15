import { useEffect, useRef, useState, type CSSProperties } from "react";

interface CropImageProps {
  src?: string | null;
  /** object-position style value, e.g. "50% 30%". null → center. */
  position?: string | null;
  /** Zoom factor (1 = fit/cover). null → 1. */
  scale?: number | null;
  alt?: string;
  className?: string;
  /** Extra styles merged onto the box (e.g. explicit width/height). */
  style?: CSSProperties;
  /** Called if the image fails to load (mirrors <img> onError). */
  onError?: () => void;
}

function parsePct(position: string | null | undefined): { x: number; y: number } {
  const parts = (position ?? "50% 50%").trim().split(/\s+/);
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  return {
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 50,
  };
}

/**
 * An image cropped with a focal point + zoom that renders IDENTICALLY at any box
 * size. Unlike `object-fit: cover` + `transform: scale()` (whose transform scales the
 * laid-out element around a point and therefore crops differently in a 200px picker
 * vs an 80px thumbnail), this uses the `background-size` + `background-position` model,
 * which is defined purely in proportional terms and so is box-size-independent.
 *
 * Zoom is applied as (cover size × scale) in real pixels, measured from the element's
 * own box and the image's natural dimensions, so the same (position, scale) yields the
 * same visible crop everywhere — picker preview, cards, rows, avatars.
 */
export default function CropImage({
  src,
  position,
  scale,
  alt = "",
  className = "",
  style: styleProp,
  onError,
}: CropImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [failed, setFailed] = useState(false);

  // Measure the box.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure the image's natural size.
  useEffect(() => {
    setFailed(false);
    setNat(null);
    if (!src) return;
    const img = new Image();
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => {
      setFailed(true);
      onError?.();
    };
    img.src = src;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const zoom = scale && scale > 1 ? scale : 1;
  const pct = parsePct(position);

  const style: CSSProperties = {
    ...styleProp,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `${pct.x}% ${pct.y}%`,
  };

  if (src && !failed) {
    style.backgroundImage = `url("${src.replace(/"/g, '\\"')}")`;
    if (nat && box && nat.w > 0 && nat.h > 0 && box.w > 0 && box.h > 0) {
      // cover scale, then the extra zoom. Sizes in real px keep the crop identical
      // across box sizes because they scale proportionally with the box.
      const cover = Math.max(box.w / nat.w, box.h / nat.h) * zoom;
      style.backgroundSize = `${nat.w * cover}px ${nat.h * cover}px`;
    } else {
      // Until measured, fall back to cover (correct for scale 1; a brief flash at most).
      style.backgroundSize = "cover";
    }
  }

  return <div ref={ref} role="img" aria-label={alt} className={className} style={style} />;
}
