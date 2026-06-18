import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { RoundupDetail, RoundupSummary } from "../types/models";

/** All weekly roundups, newest first — shown on the /blogs index. */
export function useRoundups() {
  return useQuery<RoundupSummary[], Error>({
    queryKey: ["roundups"],
    queryFn: () => api.get<RoundupSummary[]>("/api/roundups").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/** One roundup with its publications hydrated. `enabled` lets callers gate the fetch. */
export function useRoundup(slug: string | undefined, enabled = true) {
  return useQuery<RoundupDetail, Error>({
    queryKey: ["roundup", slug],
    queryFn: () => api.get<RoundupDetail>(`/api/roundups/${slug}`).then((r) => r.data),
    enabled: enabled && !!slug,
    retry: false,
  });
}
