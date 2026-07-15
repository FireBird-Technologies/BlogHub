import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import type { ScrapeResult } from "../types/models";

interface ScrapeParams {
  url: string;
  /** 'publication' collapses to the base site (default); 'link' keeps the full path. */
  mode?: "publication" | "link";
}

export function useScrape() {
  return useMutation<ScrapeResult, Error, ScrapeParams>({
    mutationFn: ({ url, mode }) =>
      api.get<ScrapeResult>("/api/scrape", { params: { url, mode } }).then((r) => r.data),
  });
}
