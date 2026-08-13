import { useEffect, useRef, useState } from "react";
import { Copy, Check, Mail, X, Send } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import { blog2videoUrl } from "../../lib/blog2video";
import { copyLink } from "../../lib/inAppBrowser";
import { publicationShareUrl, shareTargets } from "../../lib/shareUrl";
import { useInviteToPublication } from "../../hooks/usePublicationInvite";
import { formatApiErrorDetail } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import type { Publication } from "../../types/models";

/** Matches the backend validator, so a typo is caught before the round-trip. */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const MAX_EMAILS = 10;

interface PublicationLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  publication: Publication;
}

export default function PublicationLiveModal({ isOpen, onClose, publication }: PublicationLiveModalProps) {
  const { user, openLoginModal } = useAuth();
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | undefined>(undefined);

  // Addresses committed as chips, plus whatever is still being typed.
  const [emails, setEmails] = useState<string[]>([]);
  const [entry, setEntry] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);

  const sentTimer = useRef<number | undefined>(undefined);

  const invite = useInviteToPublication(publication.id);

  useEffect(
    () => () => {
      window.clearTimeout(copyTimer.current);
      window.clearTimeout(sentTimer.current);
    },
    [],
  );

  // The confirmation is a flash, not a permanent state — clear it so the section
  // returns to its resting form.
  useEffect(() => {
    if (!sentCount) return;
    window.clearTimeout(sentTimer.current);
    sentTimer.current = window.setTimeout(() => setSentCount(0), 1500);
    return () => window.clearTimeout(sentTimer.current);
  }, [sentCount]);

  // Reset when reopened for a different publication, so one send's chips and
  // confirmation don't bleed into the next.
  useEffect(() => {
    if (!isOpen) return;
    setEmails([]);
    setEntry("");
    setEmailError(null);
    setSentCount(0);
  }, [isOpen, publication.id]);

  // How many addresses Send would actually mail: the list, plus a typed-but-not-yet
  // added one (which Send includes, so the count has to reflect it).
  const typedEntry = entry.trim().toLowerCase().replace(/[,;]+$/, "");
  const outgoingCount =
    emails.length + (typedEntry && !emails.includes(typedEntry) ? 1 : 0);

  const shareUrl = publicationShareUrl(publication);
  const targets = shareTargets(shareUrl, publication.title);

  const handleCopy = async () => {
    const ok = await copyLink(shareUrl);
    setCopied(ok);
    if (ok) {
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2000);
    }
  };

  /** Commit whatever is typed as a chip. Returns false if it wasn't usable. */
  const commitEntry = (raw: string): boolean => {
    const value = raw.trim().toLowerCase().replace(/[,;]+$/, "");
    if (!value) return false;
    if (!EMAIL_RE.test(value)) {
      setEmailError(`"${value}" doesn't look like an email address.`);
      return false;
    }
    if (emails.includes(value)) {
      setEntry("");
      return true; // already added — silently fine, not an error worth shouting about
    }
    if (emails.length >= MAX_EMAILS) {
      setEmailError(`You can invite up to ${MAX_EMAILS} people at a time.`);
      return false;
    }
    setEmails((prev) => [...prev, value]);
    setEntry("");
    setEmailError(null);
    return true;
  };

  const handleEntryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commitEntry(entry);
    }
    // No backspace-removes-last-entry here: the added addresses are their own list
    // below the field, not tokens inside it, so deleting one from the keyboard would
    // hit something the cursor isn't in. Each row has its own remove button.
  };

  const handleSend = () => {
    setEmailError(null);
    // Send includes whatever is still typed — but it goes straight out rather than
    // being parked in the list first, so Send means send and Enter means add.
    const pending = entry.trim();
    let list = emails;
    if (pending) {
      const value = pending.toLowerCase().replace(/[,;]+$/, "");
      if (!EMAIL_RE.test(value)) {
        setEmailError(`"${pending}" doesn't look like a valid email address.`);
        return;
      }
      if (!emails.includes(value)) list = [...emails, value];
    }
    if (!list.length) {
      setEmailError("Add at least one email address.");
      return;
    }
    if (!user) {
      openLoginModal();
      return;
    }

    invite.mutate(
      { emails: list },
      {
        onSuccess: (res) => {
          setSentCount(res.sent.length);
          // Only the failures stay behind, as chips to retry. Anything that went out
          // is cleared, including the address that was still in the input.
          setEmails(res.failed);
          setEntry("");
          setEmailError(
            res.failed.length
              ? `Couldn't send to ${res.failed.join(", ")}. You can try again.`
              : null,
          );
        },
        onError: (err) =>
          setEmailError(formatApiErrorDetail(err, "Could not send the invites. Please try again.")),
      },
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share your publication"
      maxWidth="max-w-md"
      prominentClose
    >
      <div className="flex flex-col gap-5">
        {/* Invite by email — the primary action, so it leads. */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
            <Mail size={15} className="text-red-400 shrink-0" />
            Invite people to your publication
          </p>
          <p className="text-xs text-gray-500">
            Invite them through email. Press{" "}
            <kbd className="font-sans font-medium text-gray-600">Enter</kbd> to add it in the list
            and add more than one (up to {MAX_EMAILS}).
          </p>

          {/* Input stays put at the top; each address added drops into the list below
              it, so the box you type in never moves as the list grows. */}
          <input
            type="email"
            value={entry}
            disabled={invite.isPending}
            onChange={(e) => {
              setEntry(e.target.value);
              if (emailError) setEmailError(null);
              // Starting a new batch: the previous confirmation no longer describes
              // what's on screen.
              if (sentCount) setSentCount(0);
            }}
            onKeyDown={handleEntryKeyDown}
            // Deliberately no onBlur-commit: clicking Send blurs the field, so
            // committing here would add the address to the list a frame before the
            // send instead of just sending it. Enter adds; Send sends.
            placeholder={emails.length ? "Add another…" : "friend@example.com"}
            aria-label="Email address"
            className="w-full px-3 py-2 text-xs text-gray-700 bg-white border border-gray-200
                       rounded-lg focus:outline-none focus:border-red-300
                       placeholder:text-gray-400 disabled:cursor-not-allowed
                       disabled:bg-gray-50"
          />

          {emails.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {emails.map((address) => (
                <li
                  key={address}
                  className="inline-flex items-center gap-1 max-w-full pl-2 pr-1 py-0.5 rounded-md
                             bg-gray-100 text-xs text-gray-700"
                >
                  <span className="truncate">{address}</span>
                  <button
                    type="button"
                    disabled={invite.isPending}
                    onClick={() => setEmails((prev) => prev.filter((e) => e !== address))}
                    aria-label={`Remove ${address}`}
                    className="text-gray-400 hover:text-red-600 transition-colors shrink-0
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* One status line at a time, most urgent first: failure, then success, then
              the nudge to send. Progress is shown only on the button — a second spinner
              here would report the same thing twice. */}
          {!invite.isPending && emailError && (
            <p className="text-xs text-red-600">{emailError}</p>
          )}
          {!invite.isPending && !emailError && sentCount > 0 && (
            <p
              className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg
                         px-2.5 py-2 flex items-center gap-1.5"
              role="status"
            >
              <Check size={13} className="shrink-0" />
              Invite{sentCount > 1 ? "s" : ""} sent to {sentCount}{" "}
              {sentCount > 1 ? "people" : "person"}.
            </p>
          )}
          {/* Nothing has gone out yet — say so plainly, so a queued list is never
              mistaken for a sent one. */}
          {!invite.isPending && !emailError && outgoingCount > 0 && (
            <p className="text-xs text-gray-500">
              {outgoingCount} {outgoingCount > 1 ? "people" : "person"} ready — click{" "}
              <span className="font-medium text-gray-700">
                {outgoingCount > 1 ? `Send ${outgoingCount} invites` : "Send invite"}
              </span>{" "}
              to send them the email.
            </p>
          )}

          <Button
            size="sm"
            onClick={handleSend}
            disabled={invite.isPending || outgoingCount === 0}
            className="self-start"
          >
            {invite.isPending ? <Spinner size={14} /> : <Send size={14} />}
            {invite.isPending
              ? "Sending…"
              : outgoingCount > 1
                ? `Send ${outgoingCount} invites`
                : "Send invite"}
          </Button>
        </div>

        <div className="w-full border-t border-gray-100" />

        {/* Or share the link yourself — secondary to the email invite above, so the
            url row is compact and the socials sit directly under it. */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-800">
            Or use the URL to share on socials
          </p>
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.target.select()}
              aria-label="Publication link"
              className="flex-1 min-w-0 truncate px-2 py-1 text-[11px] text-gray-500 bg-gray-50
                         border border-gray-200 rounded-md focus:outline-none focus:border-red-300"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md border
                         border-gray-200 text-[11px] font-medium text-gray-600 hover:text-red-600
                         hover:border-red-200 hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {targets.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share on ${name}`}
                title={`Share on ${name}`}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </p>
        </div>

        {/* Footer: the video promo, centered and quiet — a sentence with the product
            name as the link, rather than a button competing with Send. */}
        <div className="w-full border-t border-gray-100 pt-4 text-center">
          <p className="text-sm text-gray-600">
            Convert your post to video with{" "}
            <a
              href={blog2videoUrl("popup")}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-red-600 underline underline-offset-2
                         hover:text-red-700 transition-colors"
            >
              Blog2Video
            </a>
          </p>
        </div>
      </div>
    </Modal>
  );
}
