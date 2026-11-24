import { infiniteQueryOptions, keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { PaginatedPublications, Publication } from "../types/models";

export function getClientTimezone(): string {
  if (typeof window === "undefined") return "UTC";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}

interface UsePublicationsParams {
  category: string;
  search: string;
  sort?: string;
  limit?: number;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function usePublications({
  category,
  search,
  sort = "ranked",
  limit = 20,
  tag = "",
  dateFrom,
  dateTo,
}: UsePublicationsParams) {
  // The date_from/date_to bounds are calendar dates in the viewer's timezone;
  // send that tz so the backend builds the day window in local time (only
  // relevant when a date filter is active).
  const tz = dateFrom || dateTo ? getClientTimezone() : undefined;
  return useInfiniteQuery<PaginatedPublications, Error>({
    queryKey: ["publications", { category, search, sort, limit, tag, dateFrom, dateTo, tz }],
    queryFn: ({ pageParam }) =>
      api
        .get<PaginatedPublications>("/api/publications", {
          params: {
            cursor: pageParam,
            category: category || undefined,
            search: search || undefined,
            tag: tag || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            tz,
            sort,
            limit,
          },
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
}

interface UsePublicationsPageParams extends UsePublicationsParams {
  page: number;
  enabled?: boolean;
}

/**
 * One page of publications fetched directly by offset, so jumping to any page
 * (e.g. the last) is a single request instead of walking every cursor before it.
 * The returned queryKey is what optimistic updates (upvotes) must target.
 */
export function usePublicationsPage({
  category,
  search,
  sort = "ranked",
  limit = 20,
  tag = "",
  dateFrom,
  dateTo,
  page,
  enabled = true,
}: UsePublicationsPageParams) {
  const tz = dateFrom || dateTo ? getClientTimezone() : undefined;
  const offset = Math.max(0, (page - 1) * limit);
  const queryKey = [
    "publications",
    "page",
    { category, search, sort, limit, tag, dateFrom, dateTo, tz, offset },
  ] as const;
  const query = useQuery<PaginatedPublications, Error>({
    queryKey,
    queryFn: () =>
      api
        .get<PaginatedPublications>("/api/publications", {
          params: {
            offset: offset || undefined,
            category: category || undefined,
            search: search || undefined,
            tag: tag || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            tz,
            sort,
            limit,
          },
        })
        .then((r) => r.data),
    // Keep the previous page on screen while the next one loads (no blank flash).
    placeholderData: keepPreviousData,
    enabled,
  });
  return { ...query, queryKey };
}

/** First page of publications for marketing / landing (no infinite scroll). */
export function usePublicationsPreview(limit: number, sort = "ranked") {
  return useQuery<PaginatedPublications, Error>({
    queryKey: ["publications-preview", limit, sort],
    queryFn: () =>
      api
        .get<PaginatedPublications>("/api/publications", {
          params: { limit, sort },
        })
        .then((r) => r.data),
  });
}

/** Page size of the landing "Latest" section. Shared so the dashboard can prefetch it. */
export const LANDING_PREVIEW_LIMIT = 10;

/** Cursor-paginated publications for the landing "Latest" section (Load more). */
export function publicationsPreviewInfiniteOptions(limit: number, sort = "ranked") {
  return infiniteQueryOptions<PaginatedPublications, Error>({
    queryKey: ["publications-preview-infinite", limit, sort],
    queryFn: ({ pageParam }) =>
      api
        .get<PaginatedPublications>("/api/publications", {
          params: { cursor: pageParam, limit, sort },
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });
}

export function usePublicationsPreviewInfinite(limit: number, sort = "ranked") {
  return useInfiniteQuery(publicationsPreviewInfiniteOptions(limit, sort));
}

export function usePublication(id: string | undefined) {
  const tz = getClientTimezone();
  const queryKey = ["publication", id, tz] as const;

  const query = useQuery<Publication>({
    queryKey,
    queryFn: () => api.get<Publication>(`/api/publications/${id}`, { params: { tz } }).then((r) => r.data),
    enabled: !!id,
  });

  return { ...query, queryKey, tz };
}
