import CategorySelect from "./CategorySelect";
import SearchInput from "./SearchInput";

interface FilterBarProps {
  category: string;
  onCategory: (c: string) => void;
  onSearch: (q: string) => void;
}

export default function FilterBar({ category, onCategory, onSearch }: FilterBarProps) {
  return (
    <div className="sticky top-14 z-30 w-full bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <CategorySelect value={category} onChange={onCategory} />
        </div>
        <div className="sm:w-56 w-full">
          <SearchInput onSearch={onSearch} />
        </div>
      </div>
    </div>
  );
}
