import { useState } from "react";
import { ShieldCheck, Clock } from "lucide-react";
import ClaimPublicationModal from "./ClaimPublicationModal";
import { useAuth } from "../../context/AuthContext";
import type { Publication } from "../../types/models";

interface ClaimButtonProps {
  publication: Publication;
  className?: string;
}

export default function ClaimButton({ publication, className = "" }: ClaimButtonProps) {
  const { user, openLoginModal } = useAuth();
  const [open, setOpen] = useState(false);

  const sizeCls = "h-8 px-3.5 text-sm rounded-lg gap-1.5";

  // Already verified — the blue tick communicates this; no button needed.
  if (publication.is_verified) return null;

  // Current user already has a pending claim.
  if (user && publication.my_claim_status === "pending") {
    return (
      <span
        className={`inline-flex items-center font-medium border bg-amber-50 text-amber-700
                    border-amber-200 cursor-default ${sizeCls} ${className}`}
        title="Your claim is awaiting review"
      >
        <Clock size={15} className="text-amber-600" />
        Claim sent
      </span>
    );
  }

  const handleClick = () => {
    if (!user) {
      openLoginModal();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center font-medium border bg-white text-gray-600 border-gray-200
                    hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition-colors
                    ${sizeCls} ${className}`}
        title="Claim this publication as the original author"
      >
        <ShieldCheck size={15} className="text-red-500" />
        Claim this publication
      </button>
      {user && (
        <ClaimPublicationModal
          publication={publication}
          isOpen={open}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
