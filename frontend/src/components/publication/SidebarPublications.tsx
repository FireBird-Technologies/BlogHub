import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ThumbsUp, MessageCircle } from "lucide-react";
import { CATEGORIES } from "../../constants/categories";
import Spinner from "../ui/Spinner";
import api from "../../lib/api";
import type { PaginatedPublications, PublicationId } from "../../types/models";

interface SidebarPublicationsProps {
  currentId: PublicationId;
}

export default function SidebarPublications({ currentId }: SidebarPublicationsProps) {
  const [category, setCategory] = useState("");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<PaginatedPublications>({
    queryKey: ["sidebar-publications", category],
    queryFn: () =>
      api
        .get<PaginatedPublications>("/api/publications", {
          params: { sort: "ranked", limit: 20, category: category || undefined },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const pubs = data?.items ?? [];

  return (
    <div className="flex flex-col gap-4 pb-2">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2
                   focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20
                   hover:border-gray-300 transition-colors cursor-pointer"
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size={24} />
        </div>
      ) : pubs.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No publications.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {pubs.map((pub) => {
            const active = pub.id === currentId;
            return (
              <button
                key={pub.id}
                type="button"
                onClick={() => navigate(`/publications/${pub.id}`)}
                className={`w-full text-left p-3 rounded-xl border transition-all
                  ${active
                    ? "border-red-200 bg-red-50"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <div className="min-w-0 flex flex-col gap-1.5">
                  <p
                    className={`text-sm font-semibold leading-snug line-clamp-2
                    ${active ? "text-red-700" : "text-gray-900"}`}
                  >
                    {pub.title}
                  </p>
                  {pub.description ? (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{pub.description}</p>
                  ) : (
                    <p className="text-xs text-gray-400 italic line-clamp-1">No description</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 pt-0.5">
                    <span className="font-medium text-gray-600 truncate max-w-full">{pub.category}</span>
                    <span className="text-gray-300 select-none" aria-hidden>
                      ·
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <ThumbsUp size={11} className="text-gray-400" aria-hidden />
                      <span>{pub.upvote_count ?? 0}</span>
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <MessageCircle size={11} className="text-gray-400" aria-hidden />
                      <span>{pub.comment_count ?? 0}</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
