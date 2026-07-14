import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, ExternalLink, ShieldCheck, ShieldX } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import Spinner from "../components/ui/Spinner";

type Decision = "approved" | "rejected";

interface SlotReview {
  slot_id: string;
  publication_title: string | null;
  publication_url: string | null;
  publication_description: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  start_date: string;
  end_date: string;
  duration_days: number;
  amount_cents: number;
  currency: string;
  approval_status: string;
  email_subject: string | null;
  email_body: string | null;
  email_button_text: string | null;
  email_finalised: boolean;
  email_status: string | null;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-sm py-1.5">
      <span className="w-28 flex-shrink-0 text-gray-400">{label}</span>
      <span className="min-w-0 flex-1 text-gray-900">{children}</span>
    </div>
  );
}

/** Admin review of a paid featured booking, opened from the purchase email.
 *
 * Deliberately sends no auth header: the shared admin password in the POST body is
 * the only gate, which also keeps the axios 401 interceptor from hijacking a
 * wrong-password response into a redirect to "/".
 */
export default function AdminApproveFeatured() {
  const [searchParams] = useSearchParams();
  const slotId = searchParams.get("slot_id");

  const [password, setPassword] = useState("");
  const [review, setReview] = useState<SlotReview | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [deciding, setDeciding] = useState<Decision | null>(null);
  const [done, setDone] = useState<Decision | null>(null);
  const [error, setError] = useState("");

  const loadReview = async () => {
    setError("");
    if (!slotId) {
      setError("Invalid link. Missing booking ID.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }
    setLoadingReview(true);
    try {
      const { data } = await api.post<SlotReview>(`/api/featured/${slotId}/review`, {
        password: password.trim(),
      });
      setReview(data);
    } catch (err) {
      setError(formatApiErrorDetail(err, "Could not load this booking. Check your password."));
    } finally {
      setLoadingReview(false);
    }
  };

  const decide = async (approve: boolean) => {
    setError("");
    setDeciding(approve ? "approved" : "rejected");
    try {
      await api.post(`/api/featured/${slotId}/approve`, {
        password: password.trim(),
        approve,
      });
      setDone(approve ? "approved" : "rejected");
    } catch (err) {
      setError(formatApiErrorDetail(err, "Failed to submit. Please try again."));
    } finally {
      setDeciding(null);
    }
  };

  if (!slotId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm p-8">
          <ShieldX size={40} className="text-red-400" />
          <p className="text-gray-700 font-semibold">Invalid approval link.</p>
          <p className="text-gray-400 text-sm">This link is missing the booking ID.</p>
        </div>
      </div>
    );
  }

  if (done) {
    const approved = done === "approved";
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm p-8">
          <div
            className={`flex items-center justify-center w-14 h-14 rounded-full border ${
              approved ? "bg-emerald-50 border-emerald-100" : "bg-gray-100 border-gray-200"
            }`}
          >
            {approved ? (
              <ShieldCheck size={28} className="text-emerald-600" />
            ) : (
              <ShieldX size={28} className="text-gray-500" />
            )}
          </div>
          <p className="text-gray-900 font-semibold text-lg">
            {approved ? "Booking approved" : "Booking rejected"}
          </p>
          <p className="text-gray-500 text-sm">
            {approved
              ? "The publication will be featured on its start date — or right now, if the run has already begun. The announcement is approved on our side, and goes out to subscribers 24 hours after the run goes live (once the author has finalised their copy)."
              : "The dates have been released and are available for someone else to book. Remember to refund the payment in the Stripe dashboard."}
          </p>
        </div>
      </div>
    );
  }

  // Step 1: password.
  if (!review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-gray-900">Review featured booking</h1>
            <p className="text-sm text-gray-500">
              Enter the admin password to see this booking and its announcement email.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-900">Admin password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadReview()}
              placeholder="••••••••"
              className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors"
              autoFocus
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="button"
            onClick={loadReview}
            disabled={loadingReview}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
          >
            {loadingReview ? <Spinner size={16} /> : "View booking"}
          </button>
        </div>
      </div>
    );
  }

  // Step 2: the booking, its announcement, and the decision.
  const decided = review.approval_status !== "pending";
  const amount = `$${(review.amount_cents / 100).toFixed(2)} ${review.currency.toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Review featured booking</h1>
          <p className="text-sm text-gray-500 mb-4">
            This booking is paid but not live. Approving publishes it; rejecting releases the
            dates for someone else.
          </p>

          <div className="divide-y divide-gray-100">
            <Row label="Publication">
              <span className="font-medium">{review.publication_title ?? "—"}</span>
              {review.publication_url && (
                <a
                  href={review.publication_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                >
                  Visit <ExternalLink size={11} />
                </a>
              )}
            </Row>
            {review.publication_description && (
              <Row label="Description">
                <span className="text-gray-600 text-[13px]">{review.publication_description}</span>
              </Row>
            )}
            <Row label="Buyer">
              {review.buyer_name ?? "—"}
              {review.buyer_email && (
                <span className="text-gray-400"> · {review.buyer_email}</span>
              )}
            </Row>
            <Row label="Dates">
              {review.start_date} → {review.end_date} ({review.duration_days} days)
            </Row>
            <Row label="Paid">{amount}</Row>
          </div>
        </div>

        {/* The announcement email, and whether the author has signed off on it. */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Announcement email</h2>
            {review.email_body ? (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                  review.email_finalised
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                {review.email_finalised ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                {review.email_finalised ? "Finalised by author" : "Not yet finalised"}
              </span>
            ) : (
              <span className="text-[11px] text-gray-400">No draft</span>
            )}
          </div>

          {review.email_body ? (
            <>
              {!review.email_finalised && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
                  The author hasn&apos;t finalised this yet, so the wording may still change. You
                  can still approve the booking — the announcement will only send once they
                  finalise it.
                </p>
              )}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">{review.email_subject}</p>
                <p className="mt-2 text-[13px] text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {review.email_body}
                </p>
                <span
                  className="mt-3 inline-block bg-red-600 text-white text-xs font-semibold
                             px-3 py-1.5 rounded-lg"
                >
                  {review.email_button_text || "Read the publication"}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400">No announcement has been drafted for this booking.</p>
          )}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {decided ? (
          <p className="text-sm text-gray-500 text-center">
            This booking has already been {review.approval_status}.
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => decide(true)}
              disabled={deciding !== null}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
            >
              {deciding === "approved" ? <Spinner size={16} /> : "Approve & publish"}
            </button>
            <button
              type="button"
              onClick={() => decide(false)}
              disabled={deciding !== null}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-300 text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
            >
              {deciding === "rejected" ? <Spinner size={16} /> : "Reject & release dates"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
