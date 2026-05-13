import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import type { ScrapeResult } from "../types/models";

export function useScrape() {
  return useMutation<ScrapeResult, Error, string>({
    mutationFn: (url) => api.get<ScrapeResult>("/api/scrape", { params: { url } }).then((r) => r.data),
  });
}
