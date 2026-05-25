import { useAuth } from "../../context/AuthContext";
import Spinner from "../ui/Spinner";

export default function SigningInOverlay() {
  const { signingIn } = useAuth();
  if (!signingIn) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-white/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <Spinner size={40} />
      <p className="text-sm font-medium text-gray-700">Signing you in…</p>
    </div>
  );
}
