import { ExternalLink } from "lucide-react";
import type { PublicationDraft } from "../../types/models";

interface UrlPreviewProps {
  data: PublicationDraft | null;
}

export default function UrlPreview({ data }: UrlPreviewProps) {
  if (!data) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex gap-3 p-3">
      {data.image_url && (
        <img
          src={data.image_url}
          alt=""
          className="w-20 h-16 rounded-lg object-cover flex-shrink-0"
          onError={(e) => e.currentTarget.remove()}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 line-clamp-1">{data.title || "No title found"}</p>
        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{data.description || "No description found"}</p>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 mt-1"
        >
          <ExternalLink size={11} /> {data.url}
        </a>
      </div>
    </div>
  );
}
