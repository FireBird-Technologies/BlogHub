import { useEffect, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { Move, ZoomIn } from "lucide-react";
import CropImage from "./CropImage";

interface ImagePositionPickerProps {
  src: string;
  /** width / height of the crop preview. 1 for rows/avatars, 16/9 for the grid card. */
  aspect?: number;
  /** CSS object-position value, e.g. "50% 30%". null → centered. */
  value: string | null | undefined;
  /** Zoom factor (1 = fit). null → 1. */
  scale?: number | null;
  onChange: (position: string) => void;
  onScaleChange: (scale: number) => void;
  /** Round the preview (for avatars). */
  rounded?: boolean;
  className?: string;
}

const DEFAULT_POSITION = "50% 50%";
const MIN_SCALE = 1;
const MAX_SCALE = 5;

function parsePosition(value: string | null | undefined): { x: number; y: number } {
  const parts = (value ?? DEFAULT_POSITION).trim().split(/\s+/);
  const x = parseFloat(parts[0]);
  const y = parseFloat(parts[1]);
  return {
    x: Number.isFinite(x) ? clamp(x, 0, 100) : 50,
    y: Number.isFinite(y) ? clamp(y, 0, 100) : 50,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Focal-point + zoom picker. Shows the image cropped exactly as a thumbnail would
 * (the same CropImage model used on cards) inside a fixed-aspect box, and
 * lets the user drag to pan and zoom in (slider or scroll wheel). Emits an
 * object-position string and a scale factor.
 *
 * Dragging moves the image behind a window: drag down and the top of the picture
 * comes into view (object-position y decreases), matching the live preview.
 */
export default function ImagePositionPicker({
  src,
  aspect = 1,
  value,
  scale,
  onChange,
  onScaleChange,
  rounded = false,
  className = "",
}: ImagePositionPickerProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const pos = parsePosition(value);
  const zoom = scale && scale > 1 ? Math.min(MAX_SCALE, scale) : 1;

  // Load the image's natural size so drag can track the finger 1:1.
  useEffect(() => {
    setNat(null);
    if (!src) return;
    const img = new Image();
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src]);
  // Live focal point during a drag. Deriving it from `value` on every pointermove
  // loses movement: several pointermove events fire within one render (before the
  // onChange-triggered re-render commits), so each would read the same stale `value`
  // and only the last delta would survive. Accumulate here instead.
  const dragPos = useRef({ x: pos.x, y: pos.y });

  /**
   * The hidden overflow (in box-pixels) on each axis for the current object-cover +
   * zoom fit. object-position sweeps 0→100% across exactly this overflow, so to make
   * the image track the finger 1:1 we convert a pixel delta into a percentage of the
   * overflow (not of the box). Returns 0 for an axis with no overflow (that axis is
   * fully shown, so object-position has no effect there).
   */
  const overflow = (): { ox: number; oy: number } => {
    const box = boxRef.current;
    if (!box || !nat || !nat.w || !nat.h) return { ox: 0, oy: 0 };
    const bw = box.clientWidth;
    const bh = box.clientHeight;
    // cover scale, then the extra zoom on top (matches CropImage's background-size).
    const coverScale = Math.max(bw / nat.w, bh / nat.h) * zoom;
    return { ox: Math.max(0, nat.w * coverScale - bw), oy: Math.max(0, nat.h * coverScale - bh) };
  };

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const box = boxRef.current;
    if (!box) return;
    box.setPointerCapture(e.pointerId);
    // Seed the live focal point from the current value at drag start.
    dragPos.current = { x: pos.x, y: pos.y };
    setDragging(true);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const box = boxRef.current;
    if (!box) return;
    const { ox, oy } = overflow();
    // Convert the pixel delta to a percentage of the *overflow*, so the image tracks
    // the finger 1:1 (object-position 0→100% spans exactly the overflow). Dragging the
    // image right/down reveals its left/top, so subtract. Axes with no overflow can't
    // pan, so leave them unchanged.
    const dx = ox > 0 ? (e.movementX / ox) * 100 : 0;
    const dy = oy > 0 ? (e.movementY / oy) * 100 : 0;
    // Accumulate against the ref (not `value`), so no movement is dropped between
    // renders, then push the running total up.
    dragPos.current = {
      x: clamp(dragPos.current.x - dx, 0, 100),
      y: clamp(dragPos.current.y - dy, 0, 100),
    };
    onChange(`${dragPos.current.x.toFixed(1)}% ${dragPos.current.y.toFixed(1)}%`);
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    boxRef.current?.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    // Scroll up to zoom in, down to zoom out.
    const next = clamp(zoom - e.deltaY * 0.002, MIN_SCALE, MAX_SCALE);
    onScaleChange(Number(next.toFixed(2)));
  };

  const reset = () => {
    onChange(DEFAULT_POSITION);
    onScaleChange(1);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div
        ref={boxRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={handleWheel}
        style={{ aspectRatio: String(aspect), touchAction: "none" }}
        className={`relative w-full overflow-hidden bg-gray-100 border border-gray-200 select-none
                    ${rounded ? "rounded-full" : "rounded-lg"}
                    ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      >
        <CropImage
          src={src}
          position={`${pos.x}% ${pos.y}%`}
          scale={zoom}
          className="w-full h-full pointer-events-none"
        />
        {!dragging && (
          <span
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20
                       transition-colors text-white opacity-0 hover:opacity-100 pointer-events-none"
          >
            <Move size={20} />
          </span>
        )}
      </div>

      {/* Zoom slider */}
      <div className="flex items-center gap-2">
        <ZoomIn size={14} className="text-gray-400 shrink-0" />
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          value={zoom}
          onChange={(e) => onScaleChange(Number(e.target.value))}
          className="flex-1 accent-red-500 cursor-pointer"
          aria-label="Zoom"
        />
        <span className="text-[11px] text-gray-400 tabular-nums w-9 text-right">{zoom.toFixed(1)}×</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Drag to reposition · scroll or use the slider to zoom.</p>
        <button
          type="button"
          onClick={reset}
          className="text-[11px] text-gray-500 hover:text-gray-700 underline"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
