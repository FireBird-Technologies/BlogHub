import type { FormEvent } from "react";
import { Trash2, Send, Reply, ChevronDown, ChevronUp } from "lucide-react";
import Avatar from "../ui/Avatar";
import Spinner from "../ui/Spinner";
import type { Comment, User } from "../../types/models";

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export type CommentNodeVariant = "section" | "modal";

interface CommentNodeProps {
  comment: Comment;
  childrenMap: Map<string, Comment[]>;
  depth: number;
  variant: CommentNodeVariant;
  user: User | null;
  replyingTo: string | null;
  replyText: string;
  expanded: Set<string>;
  adding: boolean;
  onOpenReply: (id: string) => void;
  onCancelReply: () => void;
  onReplyTextChange: (text: string) => void;
  onReplySubmit: (e: FormEvent, id: string) => void;
  onToggleExpanded: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function CommentNode(props: CommentNodeProps) {
  const {
    comment,
    childrenMap,
    depth,
    variant,
    user,
    replyingTo,
    replyText,
    expanded,
    adding,
    onOpenReply,
    onCancelReply,
    onReplyTextChange,
    onReplySubmit,
    onToggleExpanded,
    onDelete,
  } = props;

  const children = childrenMap.get(comment.id) ?? [];
  const isExpanded = expanded.has(comment.id);
  const isReplying = replyingTo === comment.id;

  const topAvatar = variant === "section" ? 32 : 28;
  const nestedAvatar = variant === "section" ? 26 : 24;
  const avatarSize = depth === 0 ? topAvatar : nestedAvatar;
  const replyAvatarSize = depth === 0 ? nestedAvatar : Math.max(20, nestedAvatar - 2);
  const iconSize = depth === 0 ? 13 : 12;
  const deleteIconSize = depth === 0 ? 13 : 12;

  return (
    <div>
      <div className="flex gap-3">
        <Avatar src={comment.author.avatar_url} name={comment.author.name} position={comment.author.avatar_position} scale={comment.author.avatar_scale} size={avatarSize} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-gray-900">{comment.author.name}</span>
              <span className="text-xs text-gray-400">{timeAgo(comment.created_at)}</span>
            </div>
            {user?.id === comment.author.id && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 size={deleteIconSize} />
              </button>
            )}
          </div>

          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.content}</p>

          <div className="flex items-center gap-4 mt-2">
            <button
              type="button"
              onClick={() => onOpenReply(comment.id)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
            >
              <Reply size={iconSize} />
              Reply
            </button>
            {children.length > 0 && (
              <button
                type="button"
                onClick={() => onToggleExpanded(comment.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                {isExpanded ? <ChevronUp size={iconSize} /> : <ChevronDown size={iconSize} />}
                {isExpanded
                  ? "Hide"
                  : `View ${children.length} ${children.length === 1 ? "reply" : "replies"}`}
              </button>
            )}
          </div>

          {isReplying && user && (
            <form
              onSubmit={(e) => onReplySubmit(e, comment.id)}
              className="mt-3 flex gap-2 border-l border-gray-100 pl-3"
            >
              <Avatar src={user.avatar_url} name={user.name} position={user.avatar_position} scale={user.avatar_scale} size={replyAvatarSize} />
              <div className="flex-1 flex flex-col gap-2">
                <input
                  type="text"
                  autoFocus
                  value={replyText}
                  onChange={(e) => onReplyTextChange(e.target.value)}
                  placeholder={`Reply to ${comment.author.name}…`}
                  maxLength={1000}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm
                             text-gray-800 placeholder:text-gray-400 focus:outline-none
                             focus:border-red-400 focus:ring-1 focus:ring-red-400/20 transition-colors"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!replyText.trim() || adding}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors
                               disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {adding ? <Spinner size={12} /> : <Send size={12} />}

                  </button>
                  <button
                    type="button"
                    onClick={onCancelReply}
                    className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {isExpanded && children.length > 0 && (
            <div className="mt-3 flex flex-col gap-3 border-l border-gray-100 pl-3">
              {children.map((child) => (
                <CommentNode
                  key={child.id}
                  comment={child}
                  childrenMap={childrenMap}
                  depth={depth + 1}
                  variant={variant}
                  user={user}
                  replyingTo={replyingTo}
                  replyText={replyText}
                  expanded={expanded}
                  adding={adding}
                  onOpenReply={onOpenReply}
                  onCancelReply={onCancelReply}
                  onReplyTextChange={onReplyTextChange}
                  onReplySubmit={onReplySubmit}
                  onToggleExpanded={onToggleExpanded}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
