import type { CSSProperties } from "react";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: number;
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

export default function Avatar({ src, name = "", size = 32, className = "" }: AvatarProps) {
  const style: CSSProperties = { width: `${size}px`, height: `${size}px`, flexShrink: 0 };
  const textClass = size >= 48 ? "text-sm" : "text-xs";

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`rounded-full object-cover ${className}`}
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
