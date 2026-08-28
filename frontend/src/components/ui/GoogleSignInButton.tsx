import { useMemo, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { formatApiErrorDetail } from "../../lib/api";
import { copyLink, detectInAppBrowser, escapeToSystemBrowser } from "../../lib/inAppBrowser";
import { googleAuthConfigured } from "../../lib/googleAuth";

interface GoogleSignInButtonProps {
  onSignedIn?: () => void;
  width?: number;
}

export default function GoogleSignInButton({ onSignedIn, width }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");

  // Detect once on mount. Google blocks OAuth inside embedded webviews, so in
  // an in-app browser the GoogleLogin button is dead — render an escape UI
  // instead. Normal browsers (isInApp === false) are completely unaffected.
  const inApp = useMemo(() => detectInAppBrowser(), []);

  const handleSuccess = async (cred: CredentialResponse) => {
    if (!cred.credential) {
      console.warn("Google sign-in did not return a credential", {
        clientId: cred.clientId,
        selectBy: cred.select_by,
      });
      setError("Google did not return a credential. Please retry.");
      return;
    }
    setError("");
    try {
      // Only advance on a real session — a deactivated account resolves false and
      // shows the reactivation prompt instead, so there is nowhere to navigate yet.
      if (await loginWithGoogle(cred.credential)) {
        onSignedIn?.();
      }
    } catch (e) {
      console.warn("BlogHub sign-in failed after Google credential response", e);
      setError(formatApiErrorDetail(e, "Sign-in failed. Please retry."));
    }
  };

  if (inApp.isInApp) {
    return <InAppBrowserEscape width={width} app={inApp.app} isIOS={inApp.isIOS} />;
  }

  // Google's script cannot render a button for an empty client id, so say so rather
  // than leaving a silent gap where the sign-in pill should be.
  if (!googleAuthConfigured) {
    return (
      <p className="text-sm text-gray-500" style={{ width: width ?? 320, maxWidth: "100%" }}>
        Sign-in is temporarily unavailable.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => {
          console.warn("Google sign-in was cancelled or failed before returning a credential");
          setError("Google sign-in was cancelled or failed. Please retry.");
        }}
        shape="pill"
        theme="outline"
        size="large"
        text="signin_with"
        width={width ?? 320}
        useOneTap={false}
        use_fedcm_for_button
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

interface InAppBrowserEscapeProps {
  width?: number;
  app?: string;
  isIOS: boolean;
}

/**
 * Shown when the page is open inside an in-app browser (LinkedIn, Instagram,
 * Facebook, etc.) where Google OAuth is blocked. On Android we can hand off to
 * Chrome directly; on iOS there is no silent escape, so we show instructions.
 */
function InAppBrowserEscape({ width, app, isIOS }: InAppBrowserEscapeProps) {
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const style = { width: width ?? 320, maxWidth: "100%" } as const;

  const handleContinue = () => {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    const escaped = escapeToSystemBrowser(pageUrl);
    if (!escaped) {
      // Fallback (unexpected on Android): reveal manual instructions.
      setShowIOSHelp(true);
    }
  };

  const handleCopy = async () => {
    const ok = await copyLink(pageUrl);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
  };

  const appLabel = app ? `${app}'s in-app browser` : "this in-app browser";

  return (
    <div className="flex flex-col gap-2" style={style}>
      <button
        type="button"
        onClick={handleContinue}
        className="flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        Continue with Google
      </button>

      {(showIOSHelp || isIOS) && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-900">
          <p>
            Google sign-in doesn&apos;t work inside {appLabel}. Tap the{" "}
            <span className="font-semibold">⋯</span> menu and choose{" "}
            <span className="font-semibold">Open in Safari</span> (or your default
            browser), then sign in there.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className="text-sm text-blue-600 underline underline-offset-2 hover:text-blue-700"
      >
        {copied ? "Link copied!" : "Copy link"}
      </button>
    </div>
  );
}
