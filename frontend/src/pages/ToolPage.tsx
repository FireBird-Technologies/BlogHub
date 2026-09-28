import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowRight, Check, Copy, Lock, RefreshCw } from "lucide-react";
import LandingNavbar from "../components/landing/LandingNavbar";
import Footer from "../components/landing/Footer";
import { useAuth } from "../context/AuthContext";
import { useDocumentMeta } from "../hooks/useDocumentMeta";
import { useJsonLd } from "../hooks/useJsonLd";
import { LEGAL } from "../constants/legal";
import { POST_LOGIN_PATH_KEY } from "../lib/featuredCheckout";
import { generateNames, type NameStyle } from "../lib/nameGenerator";
import { getTool, TOOLS, TOOLS_HUB, type ToolDef } from "../content/tools";
import NotFound from "./NotFound";

const STYLES: { key: NameStyle; label: string }[] = [
  { key: "classic", label: "Classic" },
  { key: "playful", label: "Playful" },
  { key: "minimal", label: "Minimal" },
];

/** Every free tool requires sign-in. Signing in returns the visitor to this page (LoginPromptModal reads the key). */
function SignInGate({ tool }: { tool: ToolDef }) {
  const { openLoginModal } = useAuth();
  const { pathname } = useLocation();
  const signIn = () => {
    try {
      sessionStorage.setItem(POST_LOGIN_PATH_KEY, pathname);
    } catch {
      /* ignore unavailable storage */
    }
    openLoginModal();
  };
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center">
      <Lock className="mx-auto text-red-600" size={24} />
      <h2 className="mt-3 text-xl font-bold text-gray-900">Sign in to use the {tool.eyebrow.toLowerCase()}</h2>
      <p className="mt-2 text-sm text-gray-600">It's free. Sign in with Google and you'll come straight back here.</p>
      <button
        type="button"
        onClick={signIn}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-red-600/20 transition-colors hover:bg-red-700"
      >
        Sign in free <ArrowRight size={15} />
      </button>
    </div>
  );
}

function NameGeneratorWidget({ tool }: { tool: ToolDef }) {
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState<NameStyle>("classic");
  const [seed, setSeed] = useState(1);
  const [copied, setCopied] = useState<string | null>(null);
  const names = useMemo(() => generateNames(topic, tool.kind, style, seed), [topic, tool.kind, style, seed]);

  const copy = async (name: string) => {
    await navigator.clipboard?.writeText(name);
    setCopied(name);
    window.setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <label className="block text-sm font-semibold text-gray-900" htmlFor="topic">
        What is your {tool.kind} about?
      </label>
      <input
        id="topic"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        placeholder={tool.kind === "newsletter" ? "e.g. climate tech" : "e.g. budget travel"}
        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {STYLES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStyle(s.key)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              style === s.key ? "border-red-600 bg-red-600 text-white" : "border-gray-300 text-gray-700 hover:border-red-300"
            }`}
          >
            {s.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSeed((n) => n + 1)}
          disabled={!names.length}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-red-300 disabled:opacity-40"
        >
          <RefreshCw size={14} /> Generate more
        </button>
      </div>
      {names.length ? (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {names.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => copy(name)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2.5 text-left text-sm font-medium text-gray-900 transition-colors hover:border-red-300 hover:bg-red-50/40"
              >
                {name}
                {copied === name ? <Check size={15} className="text-green-600" /> : <Copy size={15} className="text-gray-400" />}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Type a topic to see name ideas. Click any name to copy it.
        </p>
      )}
    </div>
  );
}

function SectionCta({ path, label }: { path: string; label: string }) {
  const cls =
    "inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-red-600 hover:text-red-700";
  return path.startsWith("http") ? (
    <a href={path} className={cls}>
      {label} <ArrowRight size={15} />
    </a>
  ) : (
    <Link to={path} className={cls}>
      {label} <ArrowRight size={15} />
    </Link>
  );
}

export function ToolsHub() {
  useDocumentMeta({
    title: TOOLS_HUB.metaTitle,
    description: TOOLS_HUB.description,
    canonicalUrl: `${LEGAL.siteUrl}${TOOLS_HUB.path}`,
    type: "website",
  });
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <LandingNavbar />
      <div className="flex-1 px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{TOOLS_HUB.heroTitle}</h1>
          <p className="mt-3 text-gray-600">{TOOLS_HUB.heroDescription}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <Link
                key={t.slug}
                to={`/tools/${t.slug}`}
                className="rounded-2xl border border-gray-200 p-5 transition-colors hover:border-red-300"
              >
                <h2 className="text-lg font-bold text-gray-900">{t.heroTitle}</h2>
                <p className="mt-1 text-sm text-gray-600">{t.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

export default function ToolPage() {
  const { slug = "" } = useParams();
  const tool = getTool(slug);
  const { user, loading } = useAuth();

  useDocumentMeta({
    title: tool?.metaTitle,
    description: tool?.description,
    canonicalUrl: tool ? `${LEGAL.siteUrl}/tools/${tool.slug}` : undefined,
    type: "website",
  });
  useJsonLd(
    tool
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faq.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null,
  );

  if (!tool) return <NotFound />;

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <LandingNavbar />
      <div className="flex-1 px-4 sm:px-6 py-12">
        <article className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-600">{tool.eyebrow}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900">{tool.heroTitle}</h1>
          <p className="mt-3 text-lg text-gray-600">{tool.heroDescription}</p>

          <div className="mt-8">{loading ? null : user ? <NameGeneratorWidget tool={tool} /> : <SignInGate tool={tool} />}</div>

          {tool.sections.map((s) => (
            <section key={s.heading} className="mt-10">
              <h2 className="text-2xl font-bold text-gray-900">{s.heading}</h2>
              {s.paragraphs.map((p) => (
                <p key={p} className="mt-3 leading-relaxed text-gray-700">
                  {p}
                </p>
              ))}
              {s.bullets && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-gray-700">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              )}
              {s.ctaPath && s.ctaLabel && <SectionCta path={s.ctaPath} label={s.ctaLabel} />}
            </section>
          ))}

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-gray-900">Frequently asked questions</h2>
            {tool.faq.map((f) => (
              <div key={f.question} className="mt-4">
                <h3 className="font-semibold text-gray-900">{f.question}</h3>
                <p className="mt-1 text-gray-700">{f.answer}</p>
              </div>
            ))}
          </section>

          <nav className="mt-10 rounded-2xl border border-gray-200 p-5" aria-label="Related">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Keep going</h2>
            <ul className="mt-3 space-y-2">
              {tool.relatedPaths.map((r) => (
                <li key={r.path}>
                  <Link to={r.path} className="text-red-600 hover:text-red-700">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </article>
      </div>
      <Footer />
    </main>
  );
}
