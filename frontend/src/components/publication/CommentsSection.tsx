import { useState, useRef, useEffect, useMemo } from "react";
import type { FormEvent } from "react";
import { Send } from "lucide-react";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import { useAuth } from "../../context/AuthContext";
import { useComments, useAddComment, useDeleteComment } from "../../hooks/useComments";
import type { Comment } from "../../types/models";
import CommentNode from "./CommentNode";

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

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const { topLevel, childrenMap } = useMemo(() => {
    const top: Comment[] = [];
    const map = new Map<string, Comment[]>();
    for (const c of comments) {
      if (!c.parent_id) {
        top.push(c);
      } else {
        const arr = map.get(c.parent_id) ?? [];
        arr.push(c);
        map.set(c.parent_id, arr);
      }
    }
    return { topLevel: top, childrenMap: map };
  }, [comments]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim() || adding) return;
    addComment({ content: text.trim() }, { onSuccess: () => setText("") });
  };

  const openReply = (id: string) => {
    if (!user) {
      openLoginModal();
      return;
    }
    setReplyingTo(id);
    setReplyText("");
    setExpanded((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleReplySubmit = (e: FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || adding) return;
    addComment(
      { content: replyText.trim(), parent_id: parentId },
      {
        onSuccess: () => {
          setReplyText("");
          setReplyingTo(null);
        },
      }
    );
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyText("");
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
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50">
          {topLevel.map((c) => (
            <div key={c.id} className="py-4 first:pt-0">
              <CommentNode
                comment={c}
                childrenMap={childrenMap}
                depth={0}
                variant="section"
                user={user}
                replyingTo={replyingTo}
                replyText={replyText}
                expanded={expanded}
                adding={adding}
                onOpenReply={openReply}
                onCancelReply={cancelReply}
                onReplyTextChange={setReplyText}
                onReplySubmit={handleReplySubmit}
                onToggleExpanded={toggleExpanded}
                onDelete={(id) => deleteComment(id)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
