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
}

export function usePublications({ category, search, sort = "ranked" }: UsePublicationsParams) {
  return useInfiniteQuery<PaginatedPublications, Error>({
    queryKey: ["publications", { category, search, sort }],
    queryFn: ({ pageParam }) =>
      api
        .get<PaginatedPublications>("/api/publications", {
          params: {
            cursor: pageParam,
            category: category || undefined,
            search: search || undefined,
            sort,
            limit: 20,
          },
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 30_000,
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
