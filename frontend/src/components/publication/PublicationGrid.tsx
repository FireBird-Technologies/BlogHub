import { useEffect, useRef } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import PublicationCard from "./PublicationCard";
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
  isLoading?: boolean;
  ranked?: boolean;
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
  isLoading,
  ranked = false,
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

  const publications = pages?.flatMap((p) => p.items) ?? [];

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
        <EmptyState onSubmit={onSubmit} />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {publications.map((pub, index) => (
          <PublicationCard
            key={pub.id}
            publication={pub}
            queryKey={queryKey}
            onDelete={onDelete}
            onEdit={onEdit}
            rank={ranked ? index + 1 : undefined}
          />
        ))}
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
