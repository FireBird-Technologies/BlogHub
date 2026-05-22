import type { MouseEvent } from "react";
import { ArrowBigUp } from "lucide-react";
import type { QueryKey } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { usePublicationUpvote } from "../../hooks/usePublicationUpvote";
import Spinner from "../ui/Spinner";

interface UpvoteButtonProps {
  publicationId: string;
  count: number;
  isUpvoted: boolean;
  queryKey: QueryKey;
  className?: string;
}

export default function UpvoteButton({
  publicationId,
  count,
  isUpvoted,
  queryKey,
  className = "",
}: UpvoteButtonProps) {
  const { user, openLoginModal } = useAuth();
  const { mutate, isPending } = usePublicationUpvote(publicationId, queryKey);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!user) { openLoginModal(); return; }
    if (!isPending) mutate();
  };

  const base =
    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border disabled:opacity-60";
  const state = isUpvoted
    ? "bg-red-50 text-red-600 border-red-200"
    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-red-200 hover:text-red-500 hover:bg-red-50";

  const combined = `${base} ${state} ${className}`.trim();

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={combined}
      aria-pressed={isUpvoted}
    >
      {isPending ? <Spinner size={14} /> : <ArrowBigUp width={32} height={16} />}
      <span>{count}</span>
    </button>
  );
}
