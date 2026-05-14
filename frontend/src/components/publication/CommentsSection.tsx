import { useState, useRef, useEffect } from "react";
import type { FormEvent } from "react";
import { Trash2, Send } from "lucide-react";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import { useAuth } from "../../context/AuthContext";
import { useComments, useAddComment, useDeleteComment } from "../../hooks/useComments";

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface CommentsSectionProps {
  publicationId: string;
  /** Increment (e.g. from parent state) to scroll-to + focus the comment field for logged-in users. */
  focusSignal?: number;
}

export default function CommentsSection({ publicationId, focusSignal = 0 }: CommentsSectionProps) {
  const { user, openLoginModal } = useAuth();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [emphasizeInput, setEmphasizeInput] = useState(false);

  useEffect(() => {
    if (!user || !focusSignal) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    setEmphasizeInput(true);
    const t = window.setTimeout(() => setEmphasizeInput(false), 2000);
    return () => window.clearTimeout(t);
  }, [focusSignal, user]);

  const { data: comments = [], isLoading } = useComments(publicationId);
  const { mutate: addComment, isPending: adding } = useAddComment(publicationId);
  const { mutate: deleteComment } = useDeleteComment(publicationId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || adding) return;
    addComment(text.trim(), { onSuccess: () => setText("") });
  };

  return (
    <section
      id="publication-comments"
      className="scroll-mt-24 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
    >
      <h2 className="text-base font-semibold text-gray-900 mb-5">
        All comments <span className="text-gray-400 font-normal">({comments.length})</span>
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
          <Avatar src={user.avatar_url} name={user.name} size={32} />
          <div className="flex-1 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              maxLength={1000}
              className={`flex-1 bg-gray-50 border rounded-xl px-3 py-2 text-sm
                         text-gray-800 placeholder:text-gray-400 focus:outline-none
                         focus:border-red-400 focus:ring-1 focus:ring-red-400/20 transition-colors
                         ${emphasizeInput ? "border-red-400 ring-2 ring-red-400/35 shadow-sm" : "border-gray-200"}`}
            />
            <button
              type="submit"
              disabled={!text.trim() || adding}
              className="p-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {adding ? <Spinner size={16} /> : <Send size={16} />}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={openLoginModal}
          className="w-full text-sm text-gray-400 mb-6 text-left bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:border-red-300 hover:text-red-500 transition-colors cursor-pointer"
        >
          Sign in to leave a comment…
        </button>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size={24} />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 py-4 first:pt-0">
              <Avatar src={c.author.avatar_url} name={c.author.name} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-semibold text-gray-900">{c.author.name}</span>
                    <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                  </div>
                  {user?.id === c.author.id && (
                    <button
                      type="button"
                      onClick={() => deleteComment(c.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
