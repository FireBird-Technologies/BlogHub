import { BadgeCheck, ShieldAlert } from "lucide-react";

interface VerificationBadgeProps {
  isVerified: boolean;
  verifiedAt?: string | null;
  className?: string;
  showDate?: boolean;
}

function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function VerificationBadge({
  isVerified,
  verifiedAt,
  className = "",
  showDate = true,
}: VerificationBadgeProps) {
  if (isVerified) {
    return (
      <span
        title={verifiedAt ? `Verified on ${formatShortDate(verifiedAt)}` : "Verified"}
        className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium
                    border bg-emerald-50 text-emerald-700 border-emerald-200 ${className}`}
      >
        <BadgeCheck size={12} className="text-emerald-600" />
        Verified
        {showDate && verifiedAt && (
          <span className="font-normal text-emerald-600/70">· {formatShortDate(verifiedAt)}</span>
        )}
      </span>
    );
  }

  return (
    <span
      title="This publication has not been claimed by its author yet"
      className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium
                  border bg-gray-100 text-gray-500 border-gray-200 ${className}`}
    >
      <ShieldAlert size={12} className="text-gray-400" />
      Unverified
    </span>
  );
}
