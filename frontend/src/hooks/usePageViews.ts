import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends a GA4 `page_view` on every client-side route change.
 *
 * gtag.js only auto-fires a page_view on the initial document load; in a SPA the
 * subsequent React Router navigations swap components without a reload, so we
 * emit the event ourselves. Must be called from a component inside <BrowserRouter>.
 */
export function usePageViews() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    // Defer one frame so the destination page's title effect (useDocumentMeta)
    // has run and document.title reflects the new route.
    const raf = requestAnimationFrame(() => {
      window.gtag?.("event", "page_view", {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    });
    return () => cancelAnimationFrame(raf);
  }, [location]);
}
