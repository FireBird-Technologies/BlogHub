import { useEffect, useRef } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import PublicationCard from "./PublicationCard";
import { bookingState, type FeaturedPillState } from "./FeaturedSlotsMenu";
import type { FeaturedEmail, MyBooking } from "../../types/models";
import EmptyState from "./EmptyState";
import Spinner from "../ui/Spinner";
import type { Publication, PaginatedPublications } from "../../types/models";

interface PublicationGridProps {
  pages: InfiniteData<PaginatedPublications>["pages"] | undefined;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  queryKey: QueryKey;
  onSubmit?: () => void;
  onDelete?: (id: string) => void | Promise<void>;
  onEdit?: (p: Publication) => void;
  /** Per-publication featured runs + their announcements, resolved by the caller.
   *  A publication may hold several runs. Omitted everywhere but the owner's profile. */
  featuredInfo?: (p: Publication) => {
    bookings: MyBooking[];
    emails: FeaturedEmail[];
    onOpenEmail: (emailId: string) => void;
    onOpenAnalytics: (booking: MyBooking) => void;
  };
  isLoading?: boolean;
  ranked?: boolean;
  /** Overrides the empty-state copy (e.g. per profile tab). */
  emptyState?: { title?: string; description?: string };
}

export default function PublicationGrid({
  pages,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  queryKey,
  onSubmit,
  onDelete,
  onEdit,
  featuredInfo,
  isLoading,
  ranked = false,
  emptyState,
}: PublicationGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const flat = pages?.flatMap((p) => p.items) ?? [];

  // Float featured publications (live, scheduled, or awaiting review) to the front,
  // regardless of when they were published — the owner needs to see the ones that
  // need attention first. Only applies where `featuredInfo` is supplied (the owner's
  // profile); a ranked grid numbers by position, so we never reorder one of those.
  const FEATURED_ORDER: Record<FeaturedPillState, number> = {
    pending: 0,
    active: 1,
    scheduled: 2,
  };
  // Rank a publication by its most urgent run.
  const rankOf = (p: Publication): number => {
    const bs = featuredInfo?.(p).bookings ?? [];
    if (!bs.length) return 99; // not featured
    return Math.min(...bs.map((b) => FEATURED_ORDER[bookingState(b)]));
  };
  const publications =
    featuredInfo && !ranked
      ? [...flat].sort((a, b) => rankOf(a) - rankOf(b)) // stable: ties keep server order
      : flat;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={36} />
      </div>
    );
  }

  if (publications.length === 0) {
    return (
      <div className="grid">
        <EmptyState
          onSubmit={onSubmit}
          title={emptyState?.title}
          description={emptyState?.description}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {publications.map((pub, index) => {
          const info = featuredInfo?.(pub);
          return (
          <PublicationCard
            key={pub.id}
            publication={pub}
            queryKey={queryKey}
            onDelete={onDelete}
            onEdit={onEdit}
            rank={ranked ? index + 1 : undefined}
            featuredBookings={info?.bookings}
            featuredEmails={info?.emails}
            onOpenEmail={info?.onOpenEmail}
            onOpenAnalytics={info?.onOpenAnalytics}
          />
          );
        })}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Spinner size={28} />
        </div>
      )}
    </div>
  );
}
