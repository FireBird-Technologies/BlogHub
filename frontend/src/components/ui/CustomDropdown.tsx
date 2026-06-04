import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface CustomDropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface CustomDropdownProps {
  value: string;
  options: CustomDropdownOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export default function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = "Select…",
  className = "",
  buttonClassName = "",
}: CustomDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-gray-200
                    bg-white text-gray-700 text-sm font-medium hover:border-gray-300 transition-colors ${buttonClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected?.icon && <span className="shrink-0 flex items-center text-gray-500">{selected.icon}</span>}
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown
          size={15}
          className={`transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-left transition-colors
                  ${active ? "text-red-600 font-semibold bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  {opt.icon && (
                    <span className={`shrink-0 flex items-center ${active ? "text-red-600" : "text-gray-500"}`}>
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </span>
                {active && <Check size={14} className="text-red-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
