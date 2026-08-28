import { useMutation } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import { useAuth } from "../../context/AuthContext";
import api, { formatApiErrorDetail } from "../../lib/api";

/**
 * Confirmation step for account deletion. Everything the user has posted is
 * removed; only the account row survives (deactivated, so they can reactivate later).
 */
export default function DeleteAccountModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => api.delete("/api/me"),
    // logout() clears the token and hard-redirects home, which also drops all
    // cached query data for the account that no longer exists.
    onSuccess: () => logout(),
  });

  if (!isOpen || !user) return null;

  const close = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={close}
      title="Delete your account"
      icon={<AlertTriangle size={18} className="text-red-600" />}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          This permanently deletes your publications, comments and upvotes, and
          cancels any featured slots. Your account is kept but marked inactive —
          you can reactivate it later, but your content won't come back.
        </p>

        {error && (
          <p className="text-sm text-red-600">
            {formatApiErrorDetail(error, "Could not delete your account. Please try again.")}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={close}
            disabled={isPending}
            className="flex-1 justify-center"
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutate()}
            disabled={isPending}
            className="flex-1 justify-center"
          >
            {isPending ? <Spinner size={14} /> : null} Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
}
