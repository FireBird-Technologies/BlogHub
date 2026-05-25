import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { formatApiErrorDetail } from "../../lib/api";

interface GoogleSignInButtonProps {
  onSignedIn?: () => void;
  width?: number;
}

export default function GoogleSignInButton({ onSignedIn, width }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");

  const handleSuccess = async (cred: CredentialResponse) => {
    if (!cred.credential) {
      setError("Google did not return a credential. Please retry.");
      return;
    }
    setError("");
    try {
      await loginWithGoogle(cred.credential);
      onSignedIn?.();
    } catch (e) {
      setError(formatApiErrorDetail(e, "Sign-in failed. Please retry."));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => setError("Google sign-in was cancelled or failed.")}
        shape="pill"
        theme="outline"
        size="large"
        text="signin_with"
        width={width}
        useOneTap={false}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
