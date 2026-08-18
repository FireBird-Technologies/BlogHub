import { useState } from "react";
import { Link2 } from "lucide-react";
import { useScrape } from "../../hooks/useScrape";
import { normalizePublicationUrl } from "../../lib/urlNormalize";
import type { ScrapeResult } from "../../types/models";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";

interface UrlPhaseProps {
  onScraped: (data: ScrapeResult & { url: string }) => void;
  /** How to canonicalize the entered URL before scraping/storing it. Defaults to
   *  the publication normalizer (collapses to the bare site). Pass `normalizeLinkUrl`
   *  when the full path matters, e.g. featuring a specific page rather than a site. */
  normalizeUrl?: (url: string) => string;
  /** Prompt copy — defaults to the publication-submission wording. */
  prompt?: string;
  hint?: string;
  /** Pre-fills the input, e.g. when arriving from the "refresh your listing" email
   *  with the publication's URL already known. The author still presses Fetch. */
  initialUrl?: string;
}

export default function UrlPhase({
  onScraped,
  normalizeUrl = normalizePublicationUrl,
  prompt = "Enter the main website URL of the publication you want to share.",
  hint = "Use the homepage URL (e.g. https://firebirdtech.com).",
  initialUrl = "",
}: UrlPhaseProps) {
  const [url, setUrl] = useState(initialUrl);
  const [error, setError] = useState("");
  const { mutate, isPending } = useScrape();

  const handleFetch = () => {
    setError("");
    const scrapeUrl = url.includes("://") ? url : `https://${url}`;
    try {
      new URL(scrapeUrl);
    } catch {
      setError("Please enter a valid URL (e.g. firebirdtech.com or https://firebirdtech.com)");
      return;
    }

    const canonicalUrl = normalizeUrl(scrapeUrl);
    if (!canonicalUrl) {
      setError("Could not determine a valid URL from that.");
      return;
    }

    setUrl(canonicalUrl);

    mutate({ url: scrapeUrl, mode: "publication" }, {
      onSuccess: (data) => onScraped({ ...data, url: canonicalUrl }),
      onError: () => setError("Could not reach that URL. Try another."),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-500 text-sm">{prompt}</p>
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
      <p className="text-xs text-gray-400 -mt-2">{hint}</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
