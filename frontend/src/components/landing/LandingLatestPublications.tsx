import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { ArrowBigUp, MessageCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { usePublicationsPreview } from "../../hooks/usePublications";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";
import GoogleSignInPill from "../ui/GoogleSignInPill";
import Modal from "../ui/Modal";
import Spinner from "../ui/Spinner";
import type { Publication } from "../../types/models";

function formatShortDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Dashboard-style row; stats are display-only. Entire card is one click target for guests. */
function LandingPreviewRow({
  publication,
  onActivate,
}: {
  publication: Publication;
  onActivate: () => void;
}) {
  const {
    title,
    description,
    image_url,
    category,
    tags,
    upvote_count,
    comment_count,
    author,
    created_at,
  } = publication;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
      className="group relative flex gap-3 sm:gap-4 w-full text-left bg-white border border-gray-200 rounded-xl p-3 sm:p-4
                 cursor-pointer transition-all hover:border-gray-300 hover:shadow-md hover:shadow-black/[0.04]"
    >
      <div className="flex-shrink-0 w-24 h-16 sm:w-32 sm:h-[4.5rem] rounded-lg bg-gray-100 overflow-hidden border border-gray-100">
        {image_url ? (
          <img
            src={image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50">
            <svg className="w-8 h-8 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge category={category} />
          {tags?.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200"
            >
              {tag}
            </span>
          ))}
          {(tags?.length ?? 0) > 4 && (
            <span className="text-[10px] text-gray-400">+{(tags?.length ?? 0) - 4}</span>
          )}
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2">{title}</h3>
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 hidden sm:block">{description}</p>
        )}
        <div className="flex items-center gap-2 mt-auto pt-1">
          <Avatar src={author?.avatar_url} name={author?.name} size={22} />
          <span className="text-xs text-gray-500 truncate">{author?.name}</span>
          {created_at && (
            <span className="text-[10px] text-gray-400 ml-1">{formatShortDate(created_at)}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-stretch justify-center gap-2 flex-shrink-0 pointer-events-none">
        <div
          className="flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-500
                     bg-gray-50 border border-gray-200"
        >
          <MessageCircle size={14} />
          {comment_count ?? 0}
        </div>
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500
                     bg-gray-50 border border-gray-200"
        >
          <ArrowBigUp width={32} height={16} />
          <span>{upvote_count}</span>
        </div>
      </div>
    </article>
  );
}

const PREVIEW_LIMIT = 5;

export default function LandingLatestPublications() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError } = usePublicationsPreview(PREVIEW_LIMIT);
  const [signInOpen, setSignInOpen] = useState(false);
  const pendingPublicationRef = useRef<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  const items = data?.items?.slice(0, PREVIEW_LIMIT) ?? [];

  const handleActivate = (publicationId: string) => {
    if (user) {
      navigate(`/publications/${publicationId}`);
      return;
    }
    pendingPublicationRef.current = publicationId;
    setSignInOpen(true);
    setLoginError("");
  };

  const closeModal = () => {
    setSignInOpen(false);
    pendingPublicationRef.current = null;
    setLoginError("");
  };

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoginBusy(true);
      setLoginError("");
      try {
        await loginWithGoogle(tokenResponse.access_token);
        const target = pendingPublicationRef.current;
        pendingPublicationRef.current = null;
        setSignInOpen(false);
        setLoginError("");
        if (target) navigate(`/publications/${target}`);
        else navigate("/dashboard");
      } catch {
        setLoginError("Sign-in failed. Please try again.");
      } finally {
        setLoginBusy(false);
      }
    },
    onError: () => setLoginError("Google sign-in was cancelled or failed."),
  });

  return (
    <>
      <div className="w-full">
        <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Latest publications
          </h2>

          <p className="text-sm text-gray-500 mt-3 mb-5 max-w-2xl">
            A live snapshot of what readers are sharing—same layout as the dashboard.
            Sign in to open a story, comment, or add your own.
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

        {!isLoading && !isError && items.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-12">No publications yet. Be the first after you sign in.</p>
        )}

        {!isLoading && !isError && items.length > 0 && (
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {items.map((pub) => (
              <li key={pub.id}>
                <LandingPreviewRow publication={pub} onActivate={() => handleActivate(pub.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={signInOpen} onClose={closeModal} title="Sign in to continue" maxWidth="max-w-md">
        <p className="text-sm text-gray-600 leading-relaxed -mt-1 mb-5">
          Create a free account with Google to read full publications, join the discussion, and share links with the
          community.
        </p>
        <div className="flex flex-col gap-3 items-stretch">
          <GoogleSignInPill
            className="w-full"
            onClick={() => handleLogin()}
            loading={loginBusy}
          />
          {loginError && <p className="text-red-600 text-sm text-center">{loginError}</p>}
          <button
            type="button"
            onClick={closeModal}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors text-center pt-1"
          >
            Not now
          </button>
        </div>
      </Modal>
    </>
  );
}
