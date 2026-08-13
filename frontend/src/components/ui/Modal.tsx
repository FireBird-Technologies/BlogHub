import { useEffect, type ReactNode } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
  /** Render the close button with a filled, higher-contrast treatment — for
   *  modals where dismissing is the only way out (no footer cancel button). */
  prominentClose?: boolean;
  /** Small mark shown left of the title, e.g. a lucide icon. */
  icon?: ReactNode;
  /** One line under the title, for modals whose purpose needs a sentence. */
  description?: ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
  prominentClose = false,
  icon,
  description,
}: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${maxWidth} min-w-0 bg-white border border-gray-200
                    rounded-2xl shadow-2xl shadow-black/10 max-h-[90vh] overflow-y-auto overflow-x-hidden thin-scrollbar`}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100">
          <div className="flex items-start gap-2.5 min-w-0">
            {icon && <span className="shrink-0 mt-0.5">{icon}</span>}
            <div className="min-w-0">
              {/* Truncate only when there's no description: a wrapped title next to a
                  sentence reads fine, but a clipped one next to nothing does not. */}
              <h2
                className={`text-lg font-semibold text-gray-900 min-w-0 ${
                  description ? "" : "truncate"
                }`}
              >
                {title}
              </h2>
              {description && (
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={
              prominentClose
                ? "shrink-0 p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                : "p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            }
          >
            <X size={prominentClose ? 20 : 18} strokeWidth={prominentClose ? 2.5 : 2} />
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
