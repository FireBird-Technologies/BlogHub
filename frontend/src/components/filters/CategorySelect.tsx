import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { CATEGORIES } from "../../constants/categories";

interface MobileDropdownProps {
  value: string;
  onChange: (v: string) => void;
}

function MobileDropdown({ value, onChange }: MobileDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const all = ["All", ...CATEGORIES] as const;
  const label = value || "All";

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-gray-300 transition-colors"
      >
        <span>{label}</span>
        <ChevronDown size={15} className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {all.map((cat) => {
            const isAll = cat === "All";
            const active = isAll ? value === "" : value === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onChange(isAll ? "" : cat);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors
                  ${active ? "text-red-600 font-semibold bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span>{cat}</span>
                {active && <Check size={14} className="text-red-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface CategorySelectProps {
  value: string;
  onChange: (v: string) => void;
}

export default function CategorySelect({ value, onChange }: CategorySelectProps) {
  const all = ["All", ...CATEGORIES] as const;

  return (
    <>
      <div className="sm:hidden">
        <MobileDropdown value={value} onChange={onChange} />
      </div>

      <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {all.map((cat) => {
          const isAll = cat === "All";
          const active = isAll ? value === "" : value === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(isAll ? "" : cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                ${active
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600"
                }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </>
  );
}
