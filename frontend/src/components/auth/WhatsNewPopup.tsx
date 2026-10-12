import { useCallback, useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { notestackUrl } from "../../lib/blog2video";

/**
 * Global "what's new" modal announcing Notestack, shown once per real sign-in
 * (never on a reload, which restores the session without signing in). Mirrors
 * blog2video's MarketingDesignerPopup; BlogHub has no plans, so every user sees it.
 *
 * First-time users see the onboarding modal first: the popup waits for
 * `user.onboarded`, which flips when onboarding is completed or skipped, so it
 * opens right as onboarding closes.
 *
 * To announce a new update, edit the UPDATE const below.
 */
const UPDATE = {
  titleLines: ["Meet Notestack,", "research your own archive"],
  intro: "Turn your blog, newsletter, site or PDFs into a research notebook you can question, with every answer cited to what you wrote.",
  points: [
    "Research notebooks built from your own writing",
    "Slide decks generated from your posts",
    "Mind maps of the topics you keep returning to",
    "Two-host podcasts you can publish",
    "Launch kits for every platform",
  ],
  cta: "Explore →",
  href: notestackUrl("whats_new_popup"),
  ariaLabel: "What's new: Notestack",
} as const;

/** Star positions (percent of the modal), size in px, and twinkle delay in ms. */
const STARS = [
  { top: 6, left: 12, size: 2, delay: 0 },
  { top: 14, left: 48, size: 1, delay: 900 },
  { top: 9, left: 78, size: 1.5, delay: 1500 },
  { top: 26, left: 92, size: 1, delay: 400 },
  { top: 34, left: 6, size: 1.5, delay: 1100 },
  { top: 42, left: 64, size: 1, delay: 1900 },
  { top: 55, left: 95, size: 2, delay: 700 },
  { top: 63, left: 3, size: 1, delay: 200 },
  { top: 72, left: 40, size: 1, delay: 1300 },
  { top: 80, left: 88, size: 1.5, delay: 600 },
  { top: 90, left: 18, size: 1.5, delay: 1700 },
  { top: 95, left: 70, size: 1, delay: 1000 },
];

export default function WhatsNewPopup() {
  const { user, justLoggedIn, consumeJustLoggedIn } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Wait out onboarding; the flag stays set until the user has onboarded.
    if (!user || !justLoggedIn || !user.onboarded) return;
    consumeJustLoggedIn();
    setShow(true);
  }, [user, justLoggedIn, consumeJustLoggedIn]);

  const close = useCallback(() => setShow(false), []);

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, close]);

  if (!show) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} aria-hidden />
      <div
        className="relative rounded-2xl shadow-2xl max-w-md w-full overflow-hidden ring-1 ring-white/10"
        style={{
          background:
            "radial-gradient(ellipse at 15% 0%, rgba(30,48,75,0.4) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(20,35,60,0.35) 0%, transparent 55%), linear-gradient(160deg, #05070c 0%, #0a0f1a 55%, #030409 100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={UPDATE.ariaLabel}
      >
        {/* Night-sky starfield behind the content */}
        {STARS.map((star, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="explore-star pointer-events-none absolute rounded-full bg-white"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}ms`,
              boxShadow: "0 0 4px rgba(255,255,255,0.9)",
            }}
          />
        ))}

        {/* "What's new" tag sits above the heading */}
        <div className="relative px-7 pt-9 pb-5">
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white ring-1 ring-white/15">
            What's new
          </span>

          <h2 className="mt-3 text-2xl font-bold leading-tight text-white">
            {UPDATE.titleLines.map((line, i) => (
              <span key={line}>
                {line}
                {i < UPDATE.titleLines.length - 1 && <br />}
              </span>
            ))}
          </h2>
        </div>

        {/* Body */}
        <div className="relative px-7 pb-8">
          <p className="text-sm text-slate-300 leading-relaxed">{UPDATE.intro}</p>

          <ul className="mt-5 space-y-3">
            {UPDATE.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm text-slate-200">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>

          <a
            href={UPDATE.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            className="mt-8 block w-full py-3 text-center text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.99]"
          >
            {UPDATE.cta}
          </a>
          <button
            type="button"
            onClick={close}
            className="mt-2 w-full py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
