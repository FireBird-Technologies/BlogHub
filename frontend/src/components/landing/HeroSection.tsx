import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowBigUp, Link2, Loader2, MessageCircle, Check } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import GoogleSignInPill from "../ui/GoogleSignInPill";
import Avatar from "../ui/Avatar";

const TYPED_URL = "https://medium.com/design/typography-tips";

const MOCK_PUB = {
  title: "Typography Tips Every Designer Should Know",
  description:
    "A deep dive into the art of type — how spacing, weight, and contrast work together to create great reading experiences.",
  category: "Design",
  author: { name: "Sarah Chen", avatar_url: null as string | null },
  upvote_count: 248,
} as const;

type DemoPhase = "typing" | "fetching" | "result";

function CategoryBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200">
      {label}
    </span>
  );
}

function DemoPanel() {
  const [phase, setPhase] = useState<DemoPhase>("typing");
  const [typedLen, setTypedLen] = useState(0);

  useEffect(() => {
    if (phase === "typing") {
      if (typedLen < TYPED_URL.length) {
        const t = window.setTimeout(() => setTypedLen((n) => n + 1), 55);
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setPhase("fetching"), 700);
      return () => window.clearTimeout(t);
    }
    if (phase === "fetching") {
      const t = window.setTimeout(() => setPhase("result"), 1800);
      return () => window.clearTimeout(t);
    }
    if (phase === "result") {
      const t = window.setTimeout(() => {
        setPhase("typing");
        setTypedLen(0);
      }, 4000);
      return () => window.clearTimeout(t);
    }
  }, [phase, typedLen]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        {["Paste URL", "Preview", "Publish"].map((label, i) => {
          const done =
            (i === 0 && (phase === "fetching" || phase === "result")) || (i === 1 && phase === "result");
          const active =
            (i === 0 && phase === "typing") || (i === 1 && phase === "fetching") || (i === 2 && phase === "result");
          return (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300
                  ${done ? "bg-green-500 text-white" : active ? "bg-red-600 text-white" : "bg-gray-100 text-gray-400"}`}
              >
                {done ? <Check size={11} /> : i + 1}
              </div>
              <span
                className={`text-sm font-medium transition-colors duration-300 ${active ? "text-gray-900" : "text-gray-400"}`}
              >
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-200 ml-1" />}
            </div>
          );
        })}
      </div>

      <div className="min-h-[260px] flex flex-col">
        <AnimatePresence mode="wait">
          {phase === "typing" && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Article URL</p>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/80">
                  <Link2 size={15} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-mono flex-1 truncate">
                    {TYPED_URL.slice(0, typedLen)}
                    <span className="inline-block w-px h-4 bg-red-500 ml-0.5 animate-pulse align-middle" />
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled
                className="self-start px-4 py-2 rounded-xl bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
              >
                Fetch Preview
              </button>
            </motion.div>
          )}

          {phase === "fetching" && (
            <motion.div
              key="fetching"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/80">
                <Link2 size={15} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 font-mono flex-1 truncate">{TYPED_URL}</span>
              </div>
              <div className="flex items-center gap-3 py-10">
                <Loader2 size={20} className="text-red-500 animate-spin flex-shrink-0" />
                <p className="text-sm text-gray-500">Fetching preview…</p>
              </div>
            </motion.div>
          )}

          {phase === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col gap-4"
            >
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-purple-100 via-pink-50 to-rose-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <CategoryBadge label={MOCK_PUB.category} />
                  <p className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">{MOCK_PUB.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{MOCK_PUB.description}</p>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={MOCK_PUB.author.name} size={24} />
                  <span className="text-sm text-gray-500">{MOCK_PUB.author.name}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-sm">
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} /> 12
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowBigUp width={32} height={16} /> {MOCK_PUB.upvote_count}
                  </span>
                </div>
              </div>

              <motion.button
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="self-start mt-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors"
              >
                Publish →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Blur + grid accents; render once inside the merged landing hero shell. */
export function HeroBackdrop() {
  return (
    <>
      <div aria-hidden className="absolute top-1/3 left-0 w-[500px] h-[500px] rounded-full bg-red-600/5 blur-[120px] pointer-events-none" />
      <div aria-hidden className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-red-400/5 blur-[100px] pointer-events-none" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(#dc2626 1px, transparent 1px), linear-gradient(to right, #dc2626 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </>
  );
}

export default function HeroSection() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        await loginWithGoogle(tokenResponse.access_token);
        navigate("/dashboard");
      } catch {
        setError("Sign-in failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  return (
    <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center pb-5 sm:pb-7">
        <div className="flex flex-col gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-red-600 border border-red-200 bg-red-50 rounded-full px-4 py-1.5 tracking-wide uppercase">
              BlogHub
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] tracking-tight text-gray-900"
          >
            Where great reads <span className="text-gradient">find their audience</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="text-lg text-gray-500 leading-relaxed"
          >
            Discover and share the publications that actually matter. Curated by people who read everything.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="flex flex-col items-start gap-3"
          >
            <GoogleSignInPill onClick={() => handleLogin()} loading={loading} />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <a href="#preview" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              See what's inside →
            </a>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
          <DemoPanel />
        </motion.div>
    </div>
  );
}
