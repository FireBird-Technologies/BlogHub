import { ChevronLeft, ChevronRight } from "lucide-react";
import Spinner from "./Spinner";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isFetching?: boolean;
}

function getPageSequence(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(total - 1, current + 1);

  const pages: (number | "...")[] = [1];

  if (windowStart > 2) pages.push("...");
  for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
  if (windowEnd < total - 1) pages.push("...");
  pages.push(total);

  return pages;
}

const base =
  "inline-flex items-center justify-center w-8 h-8 rounded-lg border text-xs font-semibold tabular-nums transition-colors";

export default function Pagination({ currentPage, totalPages, onPageChange, isFetching }: PaginationProps) {
  if (totalPages <= 1) return null;

  const sequence = getPageSequence(currentPage, totalPages);
  const prevDisabled = currentPage === 1;
  const nextDisabled = currentPage === totalPages || isFetching;

  return (
    <nav className="flex items-center justify-center gap-1 pt-6 pb-2" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={prevDisabled}
        aria-label="Previous page"
        className={`${base} ${
          prevDisabled
            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
            : "btn-soft border-transparent text-gray-600 hover:text-gray-900"
        }`}
      >
        <ChevronLeft size={15} />
      </button>

      {sequence.map((item, i) =>
        item === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className={`${base} border-transparent bg-transparent text-gray-400 cursor-default`}
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            disabled={item === currentPage}
            aria-label={`Page ${item}`}
            aria-current={item === currentPage ? "page" : undefined}
            className={`${base} ${
              item === currentPage
                ? "btn-gloss border-transparent bg-red-600 text-white cursor-default pointer-events-none"
                : "btn-soft border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => !nextDisabled && onPageChange(currentPage + 1)}
        disabled={nextDisabled}
        aria-label="Next page"
        className={`${base} ${
          nextDisabled
            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
            : "btn-soft border-transparent text-gray-600 hover:text-gray-900"
        }`}
      >
        {isFetching && currentPage < totalPages ? <Spinner size={14} /> : <ChevronRight size={15} />}
      </button>
    </nav>
  );
}
