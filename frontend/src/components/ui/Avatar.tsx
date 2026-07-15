import type { CSSProperties } from "react";
import CropImage from "./CropImage";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
  /** CSS object-position for how src is cropped (e.g. "50% 30%"). */
  position?: string | null;
  /** Zoom factor for the crop (1 = fit). */
  scale?: number | null;
  className?: string;
}

function getInitials(name = ""): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getColor(name = ""): string {
  const colors = [
    "bg-red-600",
    "bg-rose-600",
    "bg-orange-600",
    "bg-amber-600",
    "bg-pink-600",
    "bg-red-800",
  ];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
}

export default function Avatar({ src, name = "", size = 32, position, scale, className = "" }: AvatarProps) {
  const style: CSSProperties = { width: `${size}px`, height: `${size}px`, flexShrink: 0 };
  const textClass = size >= 48 ? "text-sm" : "text-xs";

  if (src) {
    return (
      <CropImage
        src={src}
        alt={name}
        position={position}
        scale={scale}
        style={style}
        className={`rounded-full ${className}`}
      />
    );
  }

  return (
    <div
      style={style}
      className={`rounded-full flex items-center justify-center text-white font-semibold ${textClass} ${getColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
