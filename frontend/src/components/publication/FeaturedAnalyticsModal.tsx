import { MessageCircle, ArrowBigUp, Eye } from "lucide-react";
import Modal from "../ui/Modal";
import type { MyBooking, Publication } from "../../types/models";

function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}

function StatCard({ icon, label, value, accent }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${accent}`}>
        {icon}
        {label}
      </div>
      <span className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</span>
    </div>
  );
}

/** A simple bar comparing this run's visits against upvotes/comments, so the
 *  numbers have some visual context rather than sitting as bare digits. */
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 flex-shrink-0 text-xs text-gray-500">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 flex-shrink-0 text-right text-xs font-semibold text-gray-700">
        {value.toLocaleString()}
      </span>
    </div>
  );
}

interface FeaturedAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication;
  /** The specific run these visit numbers belong to. */
  booking: MyBooking | null;
}

/** Analytics for a featured publication: visits the slot earned, plus its overall
 *  upvotes and comments, so the author can see the full picture in one place. */
export default function FeaturedAnalyticsModal({
  isOpen,
  onClose,
  publication,
  booking,
}: FeaturedAnalyticsModalProps) {
  const clicks = booking?.click_count ?? 0;
  const upvotes = publication.upvote_count;
  const comments = publication.comment_count;
  const max = Math.max(clicks, upvotes, comments, 1);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Analytics" maxWidth="max-w-md">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-sm font-semibold text-gray-900 truncate">{publication.title}</p>
          {booking && (
            <p className="text-xs text-gray-400 mt-0.5">
              Featured run: {formatDay(booking.start_date)} – {formatDay(booking.end_date)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Eye size={13} />}
            label="Clicks"
            value={clicks}
            accent="text-amber-600"
          />
          <StatCard
            icon={<ArrowBigUp size={13} />}
            label="Upvotes"
            value={upvotes}
            accent="text-red-500"
          />
          <StatCard
            icon={<MessageCircle size={13} />}
            label="Comments"
            value={comments}
            accent="text-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <StatBar label="Clicks" value={clicks} max={max} color="bg-amber-500" />
          <StatBar label="Upvotes" value={upvotes} max={max} color="bg-red-500" />
          <StatBar label="Comments" value={comments} max={max} color="bg-blue-500" />
        </div>

        <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">
          Clicks count clicks on the featured card only, while your publication is live in the
          slot. Upvotes and comments are totals for the publication overall, not just this run.
        </p>
      </div>
    </Modal>
  );
}
