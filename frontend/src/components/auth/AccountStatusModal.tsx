import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Ban, UserRoundCheck } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { formatApiErrorDetail } from "../../lib/api";

/** How long the blocked notice stays up before dismissing itself. */
const BLOCKED_AUTO_CLOSE_MS = 4000;

/**
 * Explains why a sign-in didn't produce a session.
 *
 * - "inactive": the user deleted their account. Offer to reactivate it.
 * - "blocked":  an operator blocked them. Nothing to decide, so it closes itself.
 *
 * Mounted globally, so it also covers an account being blocked mid-session.
 */
export default function AccountStatusModal() {
  const {
    accountStatus,
    canReactivate,
    reactivating,
    reactivateAccount,
    dismissAccountStatus,
  } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const blocked = accountStatus === "blocked";

  // Hooks must run on every render, so this sits above the early return and
  // simply does nothing unless the blocked notice is actually showing.
  useEffect(() => {
    if (!blocked) return;
    const timer = window.setTimeout(dismissAccountStatus, BLOCKED_AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [blocked, dismissAccountStatus]);

  if (!accountStatus) return null;

  const close = () => {
    setError(null);
    dismissAccountStatus();
  };

  if (blocked) {
    return (
      <Modal
        isOpen
        onClose={close}
        title="Your account is blocked"
        icon={<Ban size={18} className="text-red-600" />}
        maxWidth="max-w-md"
        prominentClose
      >
        <p className="text-sm text-gray-600 leading-relaxed">
          You can't sign in or use BlogHub right now. Please contact us if you think
          this is a mistake.
        </p>
      </Modal>
    );
  }

  const handleReactivate = async () => {
    setError(null);
    try {
      await reactivateAccount();
      // Land where a normal sign-in lands — the account is live again.
      navigate("/dashboard");
    } catch (err) {
      setError(formatApiErrorDetail(err, "Could not reactivate your account. Please try again."));
    }
  };

  return (
    <Modal
      isOpen
      onClose={close}
      title="Your account is inactive"
      icon={<UserRoundCheck size={18} className="text-red-600" />}
      maxWidth="max-w-md"
      prominentClose
    >
      <p className="text-sm text-gray-600 leading-relaxed">
        You deactivated this account. Reactivate it to sign back in and start fresh.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={close} disabled={reactivating}>
          Cancel
        </Button>
        {canReactivate ? (
          <Button onClick={handleReactivate} disabled={reactivating}>
            {reactivating ? "Reactivating…" : "Reactivate account"}
          </Button>
        ) : (
          // Reached via a mid-session 403 rather than a sign-in, so we have no
          // Google credential to reactivate with — they need to sign in again.
          <Button onClick={close}>Reactivate account</Button>
        )}
      </div>
    </Modal>
  );
}
