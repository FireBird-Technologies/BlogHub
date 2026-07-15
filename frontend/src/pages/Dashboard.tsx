import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import FilterBar from "../components/filters/FilterBar";
import { datePresetToRange, type DatePreset } from "../components/filters/DateFilter";
import DashboardPublicationList from "../components/publication/DashboardPublicationList";
import FeaturedPublicationBanner from "../components/featured/FeaturedPublicationBanner";
import FeaturePublicationModal from "../components/featured/FeaturePublicationModal";
import SubmitModal from "../components/submit/SubmitModal";
import Pagination from "../components/ui/Pagination";
import Button from "../components/ui/Button";
import { usePublications } from "../hooks/usePublications";
import { useActiveFeature } from "../hooks/useFeatured";
import { useAuth } from "../context/AuthContext";
import {
  FEATURE_DURATION_PARAM,
  POST_LOGIN_PATH_KEY,
  featureDashboardPath,
  parseFeatureDuration,
} from "../lib/featuredCheckout";

const PAGE_SIZE = 10;

export default function Dashboard() {
  const { user, loading: authLoading, openLoginModal } = useAuth();
  const { data: featured } = useActiveFeature();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [datePreset, setDatePreset] = useState<DatePreset>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [featureDuration, setFeatureDuration] = useState<number | undefined>();
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(() => {
    const p = Number(searchParams.get("page"));
    return Number.isInteger(p) && p >= 1 ? p : 1;
  });

  function clearFilters() {
    setCategory("");
    setSearch("");
    setDatePreset("");
    setSearchResetKey((k) => k + 1);
  }

  const { dateFrom, dateTo } = useMemo(() => datePresetToRange(datePreset), [datePreset]);

  // When a date filter is active, rank purely by score across the whole range
  // (ignoring publish date) and render as a single flat list rather than
  // day-grouped sections.
  const dateFilterActive = !!datePreset;
  const sort = dateFilterActive ? "ranked_global" : "ranked";

  // Persist the current page in the URL so it survives navigation (e.g. opening a
  // publication's detail page and hitting the browser Back button).
  const goToPage = (page: number) => {
    setCurrentPage(page);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (page <= 1) next.delete("page");
        else next.set("page", String(page));
        return next;
      },
      { replace: true },
    );
  };

  // Guests can view page 1 but must sign in to page beyond it.
  const handlePageChange = (page: number) => {
    if (!user && page !== 1) {
      openLoginModal();
      return;
    }
    goToPage(page);
  };

  // Reset to page 1 when a filter actually changes value (not on mount, and not
  // on StrictMode's dev remount) so a page restored from the URL is preserved.
  const prevFilters = useRef({ category, search, datePreset });
  useEffect(() => {
    const p = prevFilters.current;
    if (p.category !== category || p.search !== search || p.datePreset !== datePreset) {
      prevFilters.current = { category, search, datePreset };
      goToPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search, datePreset]);

  // Open the featured booking modal when arriving from pricing (e.g. /dashboard?feature=14).
  useEffect(() => {
    if (authLoading) return;
    const days = parseFeatureDuration(searchParams.get(FEATURE_DURATION_PARAM));
    if (days == null) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(FEATURE_DURATION_PARAM);
        return next;
      },
      { replace: true },
    );

    if (!user) {
      try {
        sessionStorage.setItem(POST_LOGIN_PATH_KEY, featureDashboardPath(days));
      } catch {
        /* private mode */
      }
      openLoginModal();
      return;
    }

    setFeatureDuration(days);
    setFeatureModalOpen(true);
  }, [searchParams, user, authLoading, openLoginModal, setSearchParams]);

  const queryKey = [
    "publications",
    { category, search, sort, limit: PAGE_SIZE, dateFrom, dateTo },
  ] as const;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePublications({
    category,
    search,
    sort,
    limit: PAGE_SIZE,
    dateFrom,
    dateTo,
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
      <FilterBar
        category={category}
        onCategory={setCategory}
        onSearch={setSearch}
        searchDefaultValue={search}
        datePreset={datePreset}
        onDatePreset={setDatePreset}
        isLoggedIn={!!user}
        onRequireLogin={openLoginModal}
        onClearFilters={clearFilters}
        searchResetKey={searchResetKey}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {category || search || datePreset ? "Search results" : "Top Publications"}
            </h1>
            {data?.pages?.[0] != null && (
              <p className="text-sm text-gray-400 mt-0.5">
                {data.pages[0].total} publication{data.pages[0].total !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => (user ? setModalOpen(true) : openLoginModal())}
            className="flex-shrink-0"
          >
            <Plus size={15} />
            <span>Add Publication</span>
          </Button>
        </div>

        <FeaturedPublicationBanner className="mb-6 sm:mb-8" surface="dashboard" />

        <DashboardPublicationList
          currentPageData={currentPageData}
          isPageLoading={isPageLoading}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          queryKey={queryKey}
          onSubmit={() => (user ? setModalOpen(true) : openLoginModal())}
          isLoading={isLoading}
          flatRankedList={dateFilterActive}
          excludeId={featured?.publication.id}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isFetching={isFetchingNextPage}
        />
      </main>

      <SubmitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      <FeaturePublicationModal
        isOpen={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
        initialDurationDays={featureDuration}
      />
    </div>
  );
}
