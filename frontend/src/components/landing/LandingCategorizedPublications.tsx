import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePublicationsPreview } from "../../hooks/usePublications";
import GoogleSignInButton from "../ui/GoogleSignInButton";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import { publicationPath } from "../../lib/publicationUrl";
import { publicationScore } from "../../lib/publicationGrouping";
import type { Publication } from "../../types/models";

const CATEGORY_FETCH_LIMIT = 50;
const MAX_PER_CATEGORY = 6;

interface CategoryGroup {
  category: string;
  items: Publication[];
}

/**
 * Group publications by category. Within each category, surface the latest +
 * highest-ranked items (score desc, newest first as tiebreaker), capped per group.
 * Larger groups are listed first.
 */
function groupByCategory(publications: Publication[]): CategoryGroup[] {
  const map = new Map<string, Publication[]>();
  for (const pub of publications) {
    const category = pub.category?.trim() || "Other";
    if (!map.has(category)) map.set(category, []);
    map.get(category)!.push(pub);
  }
  return [...map.entries()]
    .map(([category, items]) => ({
      category,
      items: items
        .slice()
        .sort((a, b) => {
          const ds = publicationScore(b) - publicationScore(a);
          if (ds !== 0) return ds;
          return (b.created_at ?? "").localeCompare(a.created_at ?? "");
        })
        .slice(0, MAX_PER_CATEGORY),
    }))
    .sort((a, b) => b.items.length - a.items.length || a.category.localeCompare(b.category));
}

export default function LandingCategorizedPublications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePublicationsPreview(CATEGORY_FETCH_LIMIT, "latest");
  const [signInOpen, setSignInOpen] = useState(false);
  const pendingPathRef = useRef<string | null>(null);

  const groups = groupByCategory(data?.items ?? []);

  // Columns adapt to the number of categories: up to 3 fill the row, 2 split
  // 50/50, and a single category is centered with a constrained width.
  const gridClass =
    groups.length === 1
      ? "grid grid-cols-1 max-w-lg mx-auto gap-x-8 gap-y-10"
      : groups.length === 2
        ? "grid grid-cols-1 sm:grid-cols-2 max-w-5xl mx-auto gap-x-8 gap-y-10"
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10";

  const handleActivate = (publication: Publication) => {
    const path = publicationPath(publication);
    if (user) {
      navigate(path);
      return;
    }
    pendingPathRef.current = path;
    setSignInOpen(true);
  };

  const closeModal = () => {
    setSignInOpen(false);
    pendingPathRef.current = null;
  };

  const handleSignedIn = () => {
    const target = pendingPathRef.current;
    pendingPathRef.current = null;
    setSignInOpen(false);
    navigate(target ?? "/dashboard");
  };

  return (
    <section className="pt-14 pb-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Browse by category</h2>
          <p className="text-base sm:text-lg text-gray-400 mt-3 leading-relaxed">
            Explore publications grouped by topic. Sign in to open any story and join the discussion.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner size={32} />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm text-gray-500 py-12">
            Could not load publications. Refresh the page to try again.
          </p>
        )}

        {!isLoading && !isError && groups.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-12">No publications yet. Be the first after you sign in.</p>
        )}

        {!isLoading && !isError && groups.length > 0 && (
          <div className={gridClass}>
            {groups.map(({ category, items }) => (
              <div key={category} className="flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 border-b border-gray-100 pb-2">
                  {category}
                </h3>
                <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                  {items.map((pub) => (
                    <li key={pub.id}>
                      <a
                        href={publicationPath(pub)}
                        onClick={(e) => {
                          e.preventDefault();
                          handleActivate(pub);
                        }}
                        className="group flex items-start gap-1.5 text-sm text-gray-600 leading-snug
                                   hover:text-red-600 transition-colors"
                      >
                        <span className="line-clamp-2">{pub.title}</span>
                        <ArrowUpRight
                          size={14}
                          className="mt-0.5 flex-shrink-0 text-gray-300 group-hover:text-red-500 transition-colors"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={signInOpen} onClose={closeModal} title="Sign in to continue" maxWidth="max-w-md">
        <p className="text-sm text-gray-600 leading-relaxed -mt-1 mb-5">
          Create a free account with Google to read full publications, join the discussion, and share links with the
          community.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <GoogleSignInButton onSignedIn={handleSignedIn} />
          <button
            type="button"
            onClick={closeModal}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors text-center pt-1"
          >
            Not now
          </button>
        </div>
      </Modal>
    </section>
  );
}
