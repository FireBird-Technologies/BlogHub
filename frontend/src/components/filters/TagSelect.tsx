import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTags } from "../../hooks/useTags";

interface TagSelectProps {
  value: string;
  onChange: (tag: string) => void;
}

export default function TagSelect({ value, onChange }: TagSelectProps) {
  const { data: tags = [] } = useTags();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const label = value ? `#${value}` : "All tags";

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium text-gray-800 hover:text-gray-900 transition-colors whitespace-nowrap"
      >
        <span>{label}</span>
        <ChevronDown size={15} className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto min-w-[10rem]">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className={`w-full flex items-center px-4 py-2.5 text-sm text-left transition-colors
              ${!value ? "text-red-600 font-semibold bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
          >
            All tags
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                onChange(tag);
                setOpen(false);
              }}
              className={`w-full flex items-center px-4 py-2.5 text-sm text-left transition-colors
                ${value === tag ? "text-red-600 font-semibold bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
