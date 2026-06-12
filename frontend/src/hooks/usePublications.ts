import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
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
  return useInfiniteQuery<PaginatedPublications, Error>({
    queryKey: ["publications", { category, search, sort, limit, tag, dateFrom, dateTo }],
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
            sort,
            limit,
          },
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 30_000,
  });
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
    staleTime: 60_000,
  });
}

/** Cursor-paginated publications for the landing "Latest" section (Load more). */
export function usePublicationsPreviewInfinite(limit: number, sort = "ranked") {
  return useInfiniteQuery<PaginatedPublications, Error>({
    queryKey: ["publications-preview-infinite", limit, sort],
    queryFn: ({ pageParam }) =>
      api
        .get<PaginatedPublications>("/api/publications", {
          params: { cursor: pageParam, limit, sort },
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 60_000,
  });
}

export function usePublication(id: string | undefined) {
  const tz = getClientTimezone();
  const queryKey = ["publication", id, tz] as const;

  const query = useQuery<Publication>({
    queryKey,
    queryFn: () => api.get<Publication>(`/api/publications/${id}`, { params: { tz } }).then((r) => r.data),
    enabled: !!id,
    staleTime: 30_000,
  });

  return { ...query, queryKey, tz };
}
