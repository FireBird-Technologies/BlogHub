import { useState } from "react";
import { X } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import GoogleSignInPill from "../ui/GoogleSignInPill";

export default function LoginPromptModal() {
  const { loginModalOpen, closeLoginModal, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        await loginWithGoogle(tokenResponse.access_token);
        closeLoginModal();
      } catch {
        setError("Sign-in failed. Try again.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-in was cancelled or failed."),
  });

  if (!loginModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={closeLoginModal}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4 flex flex-col items-center gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in to continue</h2>
          <p className="text-sm text-gray-500">
            You need to be signed in to perform this action.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2 items-stretch">
          <GoogleSignInPill className="w-full" onClick={() => handleLogin()} loading={loading} />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
