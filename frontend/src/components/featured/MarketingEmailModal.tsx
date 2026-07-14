import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Lock } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import { useApproveFeaturedEmail, useUpdateFeaturedEmail } from "../../hooks/useFeaturedEmail";
import { formatApiErrorDetail } from "../../lib/api";
import type { FeaturedEmail } from "../../types/models";

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/** The announcement email for a featured publication.
 *
 * Editable until the author finalises it; read-only afterwards. Finalising is the
 * author's half of the two-key approval — our team then approves it, and it sends
 * 24 hours after the publication actually goes live (not 24 hours after approval, so
 * a run booked for next week isn't announced this week).
 */
export default function MarketingEmailModal({
  email,
  isOpen,
  onClose,
}: {
  email: FeaturedEmail | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const update = useUpdateFeaturedEmail();
  const approve = useApproveFeaturedEmail();

  // Seed the fields when the modal opens on a given email. Keyed on the id, not the
  // whole object: the parent re-derives `email` from the query cache on every
  // refetch, and re-seeding on that would wipe the author's in-progress edits.
  const emailId = email?.id;
  useEffect(() => {
    if (isOpen && email) {
      setSubject(email.subject);
      setBody(email.body);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, emailId]);

  if (!email) return null;

  // Finalised by the author, or already scheduled/sent — read-only from here.
  const locked = email.author_approved || email.status !== "draft";
  const dirty = subject !== email.subject || body !== email.body;
  const busy = update.isPending || approve.isPending;

  const field =
    "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 " +
    "focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100";

  const handleFinalise = async () => {
    setError(null);
    try {
      // Save any pending edits first, so they finalise exactly what they can see.
      if (dirty) await update.mutateAsync({ id: email.id, subject, body });
      await approve.mutateAsync(email.id);
    } catch (err) {
      setError(formatApiErrorDetail(err, "Could not finalise the announcement."));
    }
  };

  const handleSave = async () => {
    setError(null);
    try {
      await update.mutateAsync({ id: email.id, subject, body });
    } catch (err) {
      setError(formatApiErrorDetail(err, "Could not save your changes."));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Marketing email" maxWidth="max-w-lg">
      <div className="flex flex-col gap-4">
        {/* Where this stands: the author's key, then ours. */}
        {locked ? (
          <div
            className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${
              email.admin_approved
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-amber-200 bg-amber-50 text-amber-800"
            }`}
          >
            {email.admin_approved ? (
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            ) : (
              <Clock size={16} className="mt-0.5 flex-shrink-0" />
            )}
            <p>
              {email.admin_approved ? (
                email.status === "sent" ? (
                  <>This announcement has been sent to BlogHub subscribers.</>
                ) : (
                  <>
                    Approved by our team
                    {email.scheduled_at ? (
                      <> — it goes out to subscribers on {formatWhen(email.scheduled_at)}.</>
                    ) : (
                      <> and scheduled.</>
                    )}
                  </>
                )
              ) : (
                <>
                  You&apos;ve finalised this. Our team will approve it shortly, and it goes out to
                  subscribers a day after your publication is featured.
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <p>
              Read this through and change anything you like. When you&apos;re done,{" "}
              <strong>finalise it</strong> — our team then approves it, and it goes out to BlogHub
              subscribers a day after your publication is featured. Nothing is sent until you
              finalise.
            </p>
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Subject</span>
          <input
            className={`${field} ${locked ? "bg-gray-50 text-gray-600" : ""}`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            readOnly={locked}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-gray-600">Message</span>
          <textarea
            className={`${field} resize-y min-h-[180px] font-mono text-[13px] leading-relaxed ${
              locked ? "bg-gray-50 text-gray-600" : ""
            }`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={8000}
            readOnly={locked}
          />
          {!locked && (
            <span className="text-[11px] text-gray-400">
              <code>{"{name}"}</code> is replaced with each subscriber&apos;s name. A link to your
              publication and an unsubscribe link are added automatically.
            </span>
          )}
        </label>

        {error && (
          <p className="flex items-start gap-1.5 text-sm text-red-600">
            <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
          {locked ? (
            <>
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <Lock size={12} /> Finalised — preview only
              </p>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 max-w-[45%]">
                Finalising locks the wording.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSave} disabled={!dirty || busy}>
                  {update.isPending && !approve.isPending ? <Spinner size={14} /> : "Save"}
                </Button>
                <Button variant="primary" size="sm" onClick={handleFinalise} disabled={busy}>
                  {approve.isPending ? (
                    <>
                      <Spinner size={14} /> Finalising…
                    </>
                  ) : (
                    "Finalise"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
