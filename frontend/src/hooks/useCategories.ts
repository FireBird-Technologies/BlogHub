import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<string[]>("/api/publications/categories").then((r) => r.data),
    staleTime: 60_000,
  });
}
