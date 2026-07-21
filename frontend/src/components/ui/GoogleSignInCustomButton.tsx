import { useMemo, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { formatApiErrorDetail } from "../../lib/api";
import { copyLink, detectInAppBrowser, escapeToSystemBrowser } from "../../lib/inAppBrowser";

interface GoogleSignInCustomButtonProps {
  onSignedIn?: () => void;
  /** Button label. Defaults to the publication CTA copy. */
  label?: string;
}

/**
 * A fully custom (red) sign-in button. Unlike GoogleSignInButton — which
 * renders Google's own iframe pill via the ID-token flow — this uses the
 * useGoogleLogin popup (access-token / implicit flow) so we control the
 * button's look entirely. It posts the access token to /auth/google/token.
 *
 * In-app browsers (LinkedIn, Instagram, …) block Google OAuth, so we render
 * the same escape UI as GoogleSignInButton there.
 */
export default function GoogleSignInCustomButton({
  onSignedIn,
  label = "Add your publication — free",
}: GoogleSignInCustomButtonProps) {
  const { loginWithGoogleAccessToken } = useAuth();
  const [error, setError] = useState("");

  const inApp = useMemo(() => detectInAppBrowser(), []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!tokenResponse.access_token) {
        setError("Google did not return an access token. Please retry.");
        return;
      }
      setError("");
      try {
        await loginWithGoogleAccessToken(tokenResponse.access_token);
        onSignedIn?.();
      } catch (e) {
        console.warn("BlogHub sign-in failed after Google token response", e);
        setError(formatApiErrorDetail(e, "Sign-in failed. Please retry."));
      }
    },
    onError: () => {
      console.warn("Google sign-in was cancelled or failed before returning a token");
      setError("Google sign-in was cancelled or failed. Please retry.");
    },
  });

  if (inApp.isInApp) {
    return <InAppBrowserEscape app={inApp.app} isIOS={inApp.isIOS} />;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => login()}
        className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700"
      >
        {label}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

interface InAppBrowserEscapeProps {
  app?: string;
  isIOS: boolean;
}

/**
 * Shown when the page is open inside an in-app browser where Google OAuth is
 * blocked. On Android we hand off to Chrome; on iOS we show instructions.
 */
function InAppBrowserEscape({ app, isIOS }: InAppBrowserEscapeProps) {
  const [showIOSHelp, setShowIOSHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleContinue = () => {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    const escaped = escapeToSystemBrowser(pageUrl);
    if (!escaped) setShowIOSHelp(true);
  };

  const handleCopy = async () => {
    const ok = await copyLink(pageUrl);
    setCopied(ok);
    if (ok) window.setTimeout(() => setCopied(false), 2000);
  };

  const appLabel = app ? `${app}'s in-app browser` : "this in-app browser";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleContinue}
        className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/20 transition-colors hover:bg-red-700"
      >
        Add your publication — free
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
