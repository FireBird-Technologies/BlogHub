import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type DatePreset = "" | "today" | "7d" | "30d";

export interface DateFilterValue {
  preset: DatePreset;
  dateFrom?: string;
  dateTo?: string;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function datePresetToRange(preset: DatePreset): { dateFrom?: string; dateTo?: string } {
  if (!preset) return {};
  const today = new Date();
  const end = toIsoDate(today);
  if (preset === "today") return { dateFrom: end, dateTo: end };
  const start = new Date(today);
  if (preset === "7d") start.setDate(start.getDate() - 6);
  if (preset === "30d") start.setDate(start.getDate() - 29);
  return { dateFrom: toIsoDate(start), dateTo: end };
}

const LABELS: Record<DatePreset, string> = {
  "": "Filter by date",
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

interface DateFilterProps {
  value: DatePreset;
  onChange: (preset: DatePreset) => void;
}

export default function DateFilter({ value, onChange }: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors whitespace-nowrap"
      >
        <span>{LABELS[value]}</span>
        <ChevronDown size={13} className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden min-w-[10rem]">
          {(Object.keys(LABELS) as DatePreset[]).map((preset) => (
            <button
              key={preset || "all"}
              type="button"
              onClick={() => {
                onChange(preset);
                setOpen(false);
              }}
              className={`w-full flex items-center px-4 py-2.5 text-sm text-left transition-colors
                ${value === preset ? "text-red-600 font-semibold bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {LABELS[preset]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
