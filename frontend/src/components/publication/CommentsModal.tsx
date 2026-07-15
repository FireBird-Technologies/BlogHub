import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { Send } from "lucide-react";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import GoogleSignInButton from "../ui/GoogleSignInButton";
import { useAuth } from "../../context/AuthContext";
import { useComments, useAddComment, useDeleteComment } from "../../hooks/useComments";
import type { Publication, Comment } from "../../types/models";
import CommentNode from "./CommentNode";

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication;
}

export default function CommentsModal({ isOpen, onClose, publication }: CommentsModalProps) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const commentInputRef = useRef<HTMLInputElement>(null);
  const [emphasizeCommentInput, setEmphasizeCommentInput] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  useEffect(() => {
    if (!isOpen) {
      setReplyingTo(null);
      setReplyText("");
      setExpanded(new Set());
    }
  }, [isOpen]);

  const pubId = isOpen ? publication.id : null;
  const { data: comments = [], isLoading } = useComments(pubId);
  const { mutate: addComment, isPending: adding } = useAddComment(publication.id);
  const { mutate: deleteComment } = useDeleteComment(publication.id);

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
    if (!user) return;
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
        ) : topLevel.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No comments yet. Be the first!</p>
        ) : (
          topLevel.map((c) => (
            <CommentNode
              key={c.id}
              comment={c}
              childrenMap={childrenMap}
              depth={0}
              variant="modal"
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
          ))
        )}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 pt-4">
          <Avatar src={user.avatar_url} name={user.name} position={user.avatar_position} scale={user.avatar_scale} size={28} />
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
          <GoogleSignInButton />
        </div>
      )}
    </Modal>
  );
}
