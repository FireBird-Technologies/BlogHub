import { useState } from "react";
import { Link2 } from "lucide-react";
import { useScrape } from "../../hooks/useScrape";
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
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL including http:// or https://");
      return;
    }
    mutate(url, {
      onSuccess: (data) => onScraped({ ...data, url }),
      onError: () => setError("Could not reach that URL. Try another."),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-gray-500 text-sm">Paste the URL of the publication you want to share.</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="https://example.com/article"
            className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg
                       pl-9 pr-3 py-2.5 placeholder:text-gray-400
                       focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
          />
        </div>
        <Button type="button" onClick={handleFetch} disabled={!url || isPending}>
          {isPending ? <Spinner size={16} /> : "Fetch Preview"}
        </Button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
