import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import LandingNavbar from "../landing/LandingNavbar";
import Navbar from "../layout/Navbar";
import Footer from "../landing/Footer";
import { useAuth } from "../../context/AuthContext";
import { useDocumentMeta } from "../../hooks/useDocumentMeta";
import { LEGAL } from "../../constants/legal";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  canonicalPath: string;
  children: ReactNode;
  crossLink?: { label: string; to: string };
  /** Optional controls shown to the right of the page title (e.g. section links). */
  headerRight?: ReactNode;
  showLastUpdated?: boolean;
}

export default function LegalPageLayout({
  title,
  description,
  canonicalPath,
  children,
  crossLink,
  headerRight,
  showLastUpdated = true,
}: LegalPageLayoutProps) {
  const { user } = useAuth();

  useDocumentMeta({
    title: `${title} — ${LEGAL.siteName}`,
    description,
    canonicalUrl: `${LEGAL.siteUrl}${canonicalPath}`,
    type: "website",
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Logged-in visitors get the dashboard navbar (so its home link points at the
          dashboard); logged-out visitors get the public landing navbar. */}
      {user ? <Navbar /> : <LandingNavbar />}
      <main className="flex-1 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto">
          <Link
            to={user ? "/dashboard" : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-8"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>

          <header className="mb-10 border-b border-gray-200 pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{title}</h1>
                {showLastUpdated && (
                  <p className="text-sm text-gray-400 mt-3">Last updated: {LEGAL.effectiveDate}</p>
                )}
              </div>
              {headerRight}
            </div>
          </header>

          <article className="legal-prose flex flex-col gap-8 text-gray-700 text-[15px] leading-relaxed">
            {children}
          </article>

          {crossLink && (
            <p className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
              See also:{" "}
              <Link to={crossLink.to} className="text-red-600 hover:text-red-700 font-medium">
                {crossLink.label}
              </Link>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
