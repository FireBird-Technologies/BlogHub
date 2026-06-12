import { useState } from "react";
import { Link2 } from "lucide-react";
import { useScrape } from "../../hooks/useScrape";
import { normalizePublicationUrl } from "../../lib/urlNormalize";
import type { ScrapeResult } from "../../types/models";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

interface UrlPhaseProps {
  onScraped: (data: ScrapeResult & { url: string }) => void;
}

export default function UrlPhase({ onScraped }: UrlPhaseProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const { mutate, isPending } = useScrape();

  const handleFetch = () => {
    setError("");
    const scrapeUrl = url.includes("://") ? url : `https://${url}`;
    try {
      new URL(scrapeUrl);
    } catch {
      setError("Please enter a valid site URL (e.g. firebirdtech.com or https://firebirdtech.com)");
      return;
    }

    const canonicalUrl = normalizePublicationUrl(scrapeUrl);
    if (!canonicalUrl) {
      setError("Could not determine your main site from that URL.");
      return;
    }

    setUrl(canonicalUrl);

    mutate(scrapeUrl, {
      onSuccess: (data) => onScraped({ ...data, url: canonicalUrl }),
      onError: () => setError("Could not reach that URL. Try another."),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-500 text-sm">Enter the <strong>main website URL</strong> of the publication you want to share.</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="https://firebirdtech.com"
            className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg
                       pl-9 pr-3 py-2.5 placeholder:text-gray-400
                       focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
          />
        </div>
        <Button type="button" onClick={handleFetch} disabled={!url || isPending}>
          {isPending ? <Spinner size={16} /> : "Fetch Preview"}
        </Button>
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Use the homepage URL (e.g. <span className="font-medium">https://firebirdtech.com</span>).
      </p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
