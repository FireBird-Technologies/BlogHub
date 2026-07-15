import { useMemo } from "react";
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
import type { PaginatedPublications } from "../../types/models";

interface DashboardPublicationListProps {
  currentPageData: PaginatedPublications | undefined;
  isPageLoading?: boolean;
  currentPage?: number;
  queryKey: QueryKey;
  onSubmit?: () => void;
  isLoading?: boolean;
  /** Flat list sorted by global rank (no date grouping). Used on category ranking pages. */
  flatRankedList?: boolean;
  pageSize?: number;
  /** Publication to omit — the featured one, which is already shown in its own card above. */
  excludeId?: string;
}

export default function DashboardPublicationList({
  currentPageData,
  isPageLoading,
  currentPage = 1,
  queryKey,
  onSubmit,
  isLoading,
  flatRankedList = false,
  pageSize = 10,
  excludeId,
}: DashboardPublicationListProps) {
  const allItems = currentPageData?.items ?? [];
  // Ranks come from the server (`pub.rank`), so dropping a row here doesn't renumber
  // the rest — the featured publication simply isn't listed twice.
  const publications = useMemo(
    () => (excludeId ? allItems.filter((p) => p.id !== excludeId) : allItems),
    [allItems, excludeId],
  );

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

  if (isPageLoading) {
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

  if (flatRankedList) {
    return (
      <div className="flex flex-col gap-3 pb-4">
        <ul className="flex flex-col gap-3 list-none p-0 m-0">
          {publications.map((pub) => (
            <li key={pub.id}>
              <PublicationRow
                publication={pub}
                queryKey={queryKey}
                // Position within the *unfiltered* page, so removing the featured row
                // doesn't shift everyone else's number up by one.
                listRank={
                  pub.rank ??
                  (currentPage - 1) * pageSize + allItems.indexOf(pub) + 1
                }
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 pb-4">
      {sections.map(({ key, items }) => (
        <section key={key} className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2">
            {sectionTitleForKey(key, todayK, yesterdayK)}
            <span className="font-normal text-gray-400 ml-2">({items.length})</span>
          </h2>
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {items.map((pub, idx) => {
              const isToday = key === todayK;
              const showTopToday = isToday && currentPage === 1 && idx === 0;
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
    </div>
  );
}
