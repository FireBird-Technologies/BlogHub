import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  onSearch: (q: string) => void;
  placeholder?: string;
  defaultValue?: string;
  /** If provided, typing any character will call this instead of searching. */
  onRequireLogin?: () => void;
}

export default function SearchInput({
  onSearch,
  placeholder = "Search publications…",
  defaultValue = "",
  onRequireLogin,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(value.trim());
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, onSearch]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (onRequireLogin && e.target.value.length > 0) {
      onRequireLogin();
      return;
    }
    setValue(e.target.value);
  }

  return (
    <div className="relative flex-1 min-w-0">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg
                   pl-9 pr-3 py-2 placeholder:text-gray-400
                   focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20
                   hover:border-gray-300 transition-colors"
      />
    </div>
  );
}
