interface VerifiedTickProps {
  verifiedAt?: string | null;
  size?: number;
  className?: string;
}

function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Twitter-style blue verified checkmark shown on verified publications. */
export default function VerifiedTick({ verifiedAt, size = 16, className = "" }: VerifiedTickProps) {
  return (
    <img
      src="/twitter-verified-badge.svg"
      width={size}
      height={size}
      alt="Verified"
      title={verifiedAt ? `Verified on ${formatShortDate(verifiedAt)}` : "Verified"}
      className={`inline-block shrink-0 align-middle ${className}`}
    />
  );
}
