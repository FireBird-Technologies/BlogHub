import { useInfiniteQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { PaginatedPublications } from "../types/models";

export function useUserPublications(userId: string | undefined) {
  return useInfiniteQuery<PaginatedPublications, Error>({
    queryKey: ["user-publications", userId],
    queryFn: ({ pageParam }) =>
      api
        .get<PaginatedPublications>(`/api/users/${userId}/publications`, {
          params: { cursor: pageParam, limit: 20 },
        })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: !!userId,
    staleTime: 30_000,
  });
}
