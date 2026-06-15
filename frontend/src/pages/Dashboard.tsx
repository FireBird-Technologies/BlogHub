import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import FilterBar from "../components/filters/FilterBar";
import { datePresetToRange, type DatePreset } from "../components/filters/DateFilter";
import DashboardPublicationList from "../components/publication/DashboardPublicationList";
import SubmitModal from "../components/submit/SubmitModal";
import Pagination from "../components/ui/Pagination";
import Button from "../components/ui/Button";
import { usePublications } from "../hooks/usePublications";
import { useAuth } from "../context/AuthContext";

const PAGE_SIZE = 10;

export default function Dashboard() {
  const { user, openLoginModal } = useAuth();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [datePreset, setDatePreset] = useState<DatePreset>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [searchResetKey, setSearchResetKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  function clearFilters() {
    setCategory("");
    setSearch("");
    setDatePreset("");
    setSearchResetKey((k) => k + 1);
  }

  const { dateFrom, dateTo } = useMemo(() => datePresetToRange(datePreset), [datePreset]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, search, datePreset]);

  const queryKey = [
    "publications",
    { category, search, sort: "ranked", limit: PAGE_SIZE, dateFrom, dateTo },
  ] as const;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePublications({
    category,
    search,
    sort: "ranked",
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

        <DashboardPublicationList
          currentPageData={currentPageData}
          isPageLoading={isPageLoading}
          currentPage={currentPage}
          pageSize={PAGE_SIZE}
          queryKey={queryKey}
          onSubmit={() => (user ? setModalOpen(true) : openLoginModal())}
          isLoading={isLoading}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isFetching={isFetchingNextPage}
        />
      </main>

      <SubmitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
