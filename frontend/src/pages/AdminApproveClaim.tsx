import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShieldCheck, ShieldX } from "lucide-react";
import api, { formatApiErrorDetail } from "../lib/api";
import Spinner from "../components/ui/Spinner";

export default function AdminApproveClaim() {
  const [searchParams] = useSearchParams();
  const pubId = searchParams.get("pub_id");
  const claimId = searchParams.get("claim_id");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleApprove = async () => {
    setError("");
    if (!pubId || !claimId) {
      setError("Invalid link. Missing publication or claim ID.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter the password.");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/publications/${pubId}/approve-claim`, {
        claim_id: claimId,
        password: password.trim(),
      });
      setSuccess(true);
    } catch (err) {
      setError(formatApiErrorDetail(err, "Failed to approve claim. Check your password and try again."));
    } finally {
      setLoading(false);
    }
  };

  if (!pubId || !claimId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm p-8">
          <ShieldX size={40} className="text-red-400" />
          <p className="text-gray-700 font-semibold">Invalid approval link.</p>
          <p className="text-gray-400 text-sm">This link is missing required parameters.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100">
            <ShieldCheck size={28} className="text-emerald-600" />
          </div>
          <p className="text-gray-900 font-semibold text-lg">Claim approved!</p>
          <p className="text-gray-500 text-sm">
            The ownership claim has been verified and ownership has been transferred to the claimer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold text-gray-900">Approve ownership claim</h1>
          <p className="text-sm text-gray-500">
            Enter the admin password to verify this claim and transfer ownership.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-gray-900">Admin password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleApprove()}
            placeholder="••••••••"
            className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-2.5 placeholder:text-gray-400 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20 hover:border-gray-300 transition-colors"
            autoFocus
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="button"
          onClick={handleApprove}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors disabled:opacity-60"
        >
          {loading ? <Spinner size={16} /> : "Approve & Transfer Ownership"}
        </button>
      </div>
    </div>
  );
}
