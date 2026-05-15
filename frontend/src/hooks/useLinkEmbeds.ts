import { useQueries } from "@tanstack/react-query";
import api from "../lib/api";
import type { ScrapeResult } from "../types/models";

export interface LinkEmbed {
  href: string;
  isLoading: boolean;
  data: ScrapeResult | null;
}

export function useLinkEmbeds(urls: string[]): LinkEmbed[] {
  const results = useQueries({
    queries: urls.map((href) => ({
      queryKey: ["link-embed", href] as const,
      queryFn: () =>
        api.get<ScrapeResult>("/api/scrape", { params: { url: href } }).then((r) => r.data),
      staleTime: 60 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: 0,
    })),
  });

  return urls.map((href, i) => ({
    href,
    isLoading: results[i].isLoading,
    data: results[i].data ?? null,
  }));
}
