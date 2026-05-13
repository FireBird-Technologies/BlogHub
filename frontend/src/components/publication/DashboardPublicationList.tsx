import { useEffect, useMemo, useRef } from "react";
import type { InfiniteData } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import PublicationRow from "./PublicationRow";
import EmptyState from "./EmptyState";
import Spinner from "../ui/Spinner";
import {
  groupPublicationsByLocalDay,
  sectionTitleForKey,
  todayKey,
  yesterdayKey,
} from "../../lib/publicationGrouping";
import type { PaginatedPublications, Publication } from "../../types/models";

interface DashboardPublicationListProps {
  pages: InfiniteData<PaginatedPublications>["pages"] | undefined;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  queryKey: QueryKey;
  onSubmit?: () => void;
  isLoading?: boolean;
}

export default function DashboardPublicationList({
  pages,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  queryKey,
  onSubmit,
  isLoading,
}: DashboardPublicationListProps) {
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

  const publications: Publication[] = pages?.flatMap((p) => p.items) ?? [];

  const sections = useMemo(() => groupPublicationsByLocalDay(publications), [publications]);
  const todayK = todayKey();
  const yesterdayK = yesterdayKey();

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
    <div className="flex flex-col gap-10">
      {sections.map(({ key, items }) => (
        <section key={key} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2">
            {sectionTitleForKey(key, todayK, yesterdayK)}
            <span className="font-normal text-gray-400 ml-2">({items.length})</span>
          </h2>
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {items.map((pub, idx) => {
              const isToday = key === todayK;
              const showTopToday = isToday && idx === 0;
              return (
                <li key={pub.id}>
                  <PublicationRow
                    publication={pub}
                    queryKey={queryKey}
                    showTopTodayBadge={showTopToday}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Spinner size={28} />
        </div>
      )}
    </div>
  );
}
