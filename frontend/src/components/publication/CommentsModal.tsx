import { useState, useRef, useEffect, type FormEvent } from "react";
import { Trash2, Send } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import GoogleSignInPill from "../ui/GoogleSignInPill";
import { useAuth } from "../../context/AuthContext";
import { useComments, useAddComment, useDeleteComment } from "../../hooks/useComments";
import type { Publication } from "../../types/models";

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication;
}

export default function CommentsModal({ isOpen, onClose, publication }: CommentsModalProps) {
  const { user, loginWithGoogle } = useAuth();
  const [text, setText] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [emphasizeCommentInput, setEmphasizeCommentInput] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    const focusId = window.setTimeout(() => {
      const el = commentInputRef.current;
      if (!el) return;
      el.focus();
      setEmphasizeCommentInput(true);
    }, 100);
    const blurEmphasisId = window.setTimeout(() => setEmphasizeCommentInput(false), 2200);
    return () => {
      window.clearTimeout(focusId);
      window.clearTimeout(blurEmphasisId);
    };
  }, [isOpen, user]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleBusy(true);
      setGoogleError("");
      try {
        await loginWithGoogle(tokenResponse.access_token);
      } catch {
        setGoogleError("Sign-in failed. Try again.");
      } finally {
        setGoogleBusy(false);
      }
    },
    onError: () => setGoogleError("Google sign-in was cancelled or failed."),
  });

  const pubId = isOpen ? publication.id : null;
  const { data: comments = [], isLoading } = useComments(pubId);
  const { mutate: addComment, isPending: adding } = useAddComment(publication.id);
  const { mutate: deleteComment } = useDeleteComment(publication.id);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || adding) return;
    addComment(text.trim(), { onSuccess: () => setText("") });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comments" maxWidth="max-w-lg">
      {publication && (
        <p className="text-sm text-gray-500 -mt-2 mb-5 line-clamp-1 border-b border-gray-100 pb-4">
          {publication.title}
        </p>
      )}

      <div className="flex flex-col gap-4 mb-6 min-h-[80px]">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size={24} />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar src={c.author.avatar_url} name={c.author.name} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-gray-900">{c.author.name}</span>
                  <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                  {user?.id === c.author.id && (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 pt-4">
          <Avatar src={user.avatar_url} name={user.name} size={28} />
          <div className="flex-1 flex gap-2">
            <input
              ref={commentInputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              maxLength={1000}
              className={`flex-1 bg-gray-50 border rounded-lg px-3 py-2 text-sm
                         text-gray-800 placeholder:text-gray-400 focus:outline-none
                         focus:border-red-400 focus:ring-1 focus:ring-red-400/20 transition-colors
                         ${emphasizeCommentInput ? "border-red-400 ring-2 ring-red-400/35 shadow-sm" : "border-gray-200"}`}
            />
            <button
              type="submit"
              disabled={!text.trim() || adding}
              className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {adding ? <Spinner size={16} /> : <Send size={16} />}
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-3 items-stretch border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500 text-center">Sign in to leave a comment.</p>
          <GoogleSignInPill className="w-full" onClick={() => handleGoogleLogin()} loading={googleBusy} />
          {googleError && <p className="text-red-600 text-sm text-center">{googleError}</p>}
        </div>
      )}
    </Modal>
  );
}
