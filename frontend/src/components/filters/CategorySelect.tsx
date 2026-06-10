import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORIES } from "../../constants/categories";
import { useCategories } from "../../hooks/useCategories";

interface CategorySelectProps {
  value: string;
  onChange: (v: string) => void;
}

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
  const { data: allCategories = [] } = useCategories();
  const customCategories = allCategories.filter((cat) => !CATEGORIES.includes(cat as any));
  const predefined = ["All", ...CATEGORIES] as const;

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isCustomActive = value === "__custom__" || customCategories.includes(value);
  const label = isCustomActive ? "Others" : value || "All Publications";

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  function select(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative inline-block w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium text-gray-800 hover:text-gray-900 transition-colors whitespace-nowrap"
      >
        <span>{label}</span>
        <ChevronDown size={15} className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:min-w-[12rem] mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
          {predefined.map((cat) => {
            const isAll = cat === "All";
            const active = isAll ? value === "" : value === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => select(isAll ? "" : cat)}
                className={`w-full flex items-center px-4 py-2.5 text-sm text-left transition-colors
                  ${active ? "text-red-600 font-semibold bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>{isAll ? "All Publications" : cat}</span>
              </button>
            );
          })}

          {customCategories.length > 0 && (
            <>
              <div className="h-px bg-gray-200" />
              <button
                type="button"
                onClick={() => select("__custom__")}
                className={`w-full flex items-center px-4 py-2.5 text-sm text-left transition-colors
                  ${isCustomActive ? "text-red-600 font-semibold bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>Others</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
