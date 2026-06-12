import { X } from "lucide-react";
import CategorySelect from "./CategorySelect";
import SearchInput from "./SearchInput";
import DateFilter, { type DatePreset } from "./DateFilter";

interface FilterBarProps {
  category: string;
  onCategory: (c: string) => void;
  onSearch: (q: string) => void;
  searchDefaultValue?: string;
  datePreset?: DatePreset;
  onDatePreset?: (preset: DatePreset) => void;
  isLoggedIn?: boolean;
  onRequireLogin?: () => void;
  onClearFilters?: () => void;
  searchResetKey?: number;
}

export default function FilterBar({
  category,
  onCategory,
  onSearch,
  searchDefaultValue,
  datePreset = "",
  onDatePreset,
  isLoggedIn = false,
  onRequireLogin,
  onClearFilters,
  searchResetKey,
}: FilterBarProps) {
  function guard<T>(fn: (v: T) => void, isEmpty: (v: T) => boolean = () => false): (v: T) => void {
    return (v) => {
      if (!isLoggedIn && !isEmpty(v)) { onRequireLogin?.(); return; }
      fn(v);
    };
  }

  const hasActiveFilter = !!(category || datePreset || searchDefaultValue);

  return (
    <div className="sticky top-14 z-30 w-full bg-gray-50/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          {/* Row 1 (mobile) / left side (desktop): filters */}
          <div className="flex items-center gap-4">
            <CategorySelect value={category} onChange={guard(onCategory, (v) => v === "")} />
            {onDatePreset && (
              <DateFilter value={datePreset} onChange={guard(onDatePreset, (v) => v === "")} />
            )}
            {hasActiveFilter && onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors whitespace-nowrap"
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>

          {/* Row 2 (mobile) / right side (desktop): search */}
          <div className="w-full sm:w-96 sm:ml-auto">
            <SearchInput
              key={searchResetKey}
              onSearch={guard(onSearch, (v) => v === "")}
              defaultValue={searchDefaultValue}
              placeholder="Search by title, description or tag…"
              onRequireLogin={!isLoggedIn ? onRequireLogin : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
