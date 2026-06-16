import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import DashboardPublicationList from "../components/publication/DashboardPublicationList";
import Pagination from "../components/ui/Pagination";
import { usePublications } from "../hooks/usePublications";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { categoryPath, resolveCategoryParam } from "../lib/categoryUrl";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 10;

export default function RankingPage() {
  const { category } = useParams();
  const { apiCategory, title } = resolveCategoryParam(category);
  const { user, openLoginModal } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  // Guests can view page 1 (SEO content) but must sign in to page beyond it.
  const handlePageChange = (page: number) => {
    if (!user && page !== 1) {
      openLoginModal();
      return;
    }
    setCurrentPage(page);
  };

  useDocumentMeta({
    title: `${title} publications, ranked — BlogHub`,
    description: `Discover the top-ranked ${title} publications on BlogHub, sorted by community score and updated daily.`,
    canonicalUrl: `${window.location.origin}${categoryPath(apiCategory)}`,
    type: "website",
  });

  const queryKey = [
    "publications",
    { category: apiCategory, search: "", sort: "ranked_global", limit: PAGE_SIZE },
  ] as const;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePublications({
    category: apiCategory,
    search: "",
    sort: "ranked_global",
    limit: PAGE_SIZE,
  });

  // Pre-fetch pages when user navigates ahead of what's cached
  useEffect(() => {
    const loaded = data?.pages.length ?? 0;
    if (currentPage > loaded && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [currentPage, data?.pages.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const total = data?.pages?.[0]?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPageData = data?.pages?.[currentPage - 1];
  const isPageLoading = currentPage > (data?.pages.length ?? 0) && isFetchingNextPage;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
        >
          <ArrowLeft size={15} />
          Back
        </Link>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          {data?.pages?.[0] != null && (
            <p className="text-sm text-gray-400 mt-0.5">
              {data.pages[0].total} publication{data.pages[0].total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <DashboardPublicationList
          currentPageData={currentPageData}
          isPageLoading={isPageLoading}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          queryKey={queryKey}
          isLoading={isLoading}
          flatRankedList
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isFetching={isFetchingNextPage}
        />
      </main>
    </div>
  );
}
