import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function useTags() {
  return useQuery<string[], Error>({
    queryKey: ["publication-tags"],
    queryFn: () => api.get<string[]>("/api/publications/tags").then((r) => r.data),
    staleTime: 120_000,
  });
}
