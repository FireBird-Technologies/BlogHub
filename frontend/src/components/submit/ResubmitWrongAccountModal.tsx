import { UserRoundX } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { switchAccountForResubmit } from "../../lib/featuredCheckout";

interface ResubmitWrongAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The publication URL from the reminder link, carried through the switch. */
  url: string;
  /** Account the reminder was addressed to, carried back so the post-login return
   *  trip can re-run the same check. */
  ownerId: string | null;
}

/**
 * Shown when someone follows the resubmit reminder link while signed in as a
 * different account than the one the email was addressed to.
 *
 * Without this they would land on a pre-filled submit form and only discover the
 * mismatch after re-entering every field, as an "already exists" error at the final
 * step. The owning account isn't named — the link carries only an opaque id, and the
 * author knows which of their accounts receives their BlogHub mail.
 */
export default function ResubmitWrongAccountModal({
  isOpen,
  onClose,
  url,
  ownerId,
}: ResubmitWrongAccountModalProps) {
  const { user, logout } = useAuth();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Wrong account"
      maxWidth="max-w-md"
      icon={<UserRoundX size={18} className="text-amber-500" />}
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm text-gray-700 leading-relaxed">
          Sorry — this publication isn&#39;t under this account, so it can&#39;t be
          resubmitted from here. Please switch to the account you received the
          reminder email on.
        </p>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-xs font-medium text-gray-500 shrink-0">Signed in as</span>
            <span className="text-gray-900 font-medium text-right break-all">
              {user?.email ?? "—"}
            </span>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          We&#39;ll bring you straight back here to resubmit once you&#39;ve signed in
          with the right account.
        </p>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => switchAccountForResubmit(url, logout, ownerId)}>
            Switch account
          </Button>
        </div>
      </div>
    </Modal>
  );
}
