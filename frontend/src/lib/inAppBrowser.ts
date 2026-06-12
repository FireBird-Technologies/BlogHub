/**
 * In-app browser (embedded webview) detection + escape helpers.
 *
 * Google blocks OAuth inside embedded webviews ("disallowed_useragent" /
 * "this browser is not secure"). iOS in-app browsers are WKWebViews that get
 * blocked; many Android in-app browsers hand off to Chrome Custom Tabs which
 * Google allows. We can't run Google OAuth inside the iOS webview at all, so
 * we detect the in-app browser and route the user to their real system browser.
 *
 * Pure and dependency-free. Safe to call on the server (returns all-false when
 * no UA is available).
 */

export interface InAppBrowserInfo {
  isInApp: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  /** Friendly name of the detected host app, when identifiable. */
  app?: string;
}

/** Named host-app user-agent signatures, checked first (most reliable). */
const NAMED_APP_PATTERNS: Array<{ app: string; test: RegExp }> = [
  { app: "Facebook", test: /FBAN|FBAV|FB_IAB/i },
  { app: "Instagram", test: /Instagram/i },
  { app: "LinkedIn", test: /LinkedInApp|LinkedIn/i },
  { app: "Line", test: /\bLine\//i },
  { app: "Twitter", test: /Twitter/i },
  { app: "Snapchat", test: /Snapchat/i },
  { app: "Pinterest", test: /Pinterest/i },
  { app: "TikTok", test: /TikTok|musical_ly|BytedanceWebview/i },
  { app: "Google App", test: /\bGSA\//i },
];

function resolveUserAgent(ua?: string): string {
  if (typeof ua === "string") return ua;
  if (typeof navigator !== "undefined" && navigator.userAgent) return navigator.userAgent;
  return "";
}

export function detectInAppBrowser(ua?: string): InAppBrowserInfo {
  const agent = resolveUserAgent(ua);

  const isIOS = /iPhone|iPod|iPad/.test(agent);
  const isAndroid = /Android/.test(agent);

  // 1. Named host-app signatures win immediately.
  for (const { app, test } of NAMED_APP_PATTERNS) {
    if (test.test(agent)) {
      return { isInApp: true, isIOS, isAndroid, app };
    }
  }

  // 2. iOS webview heuristic: real Mobile Safari (and Chrome/Firefox/Edge on
  //    iOS) always include "Safari/". A WKWebView running an embedded browser
  //    is iOS + AppleWebKit but lacks "Safari/" and isn't a known iOS browser.
  //    NOTE: an iOS home-screen PWA (standalone) also lacks "Safari/", so it
  //    is a false positive here. Acceptable: the failure mode is only showing
  //    the escape UI, never a crash.
  if (isIOS) {
    const isAppleWebKit = /AppleWebKit/.test(agent);
    const isKnownIOSBrowser = /CriOS|FxiOS|EdgiOS/.test(agent);
    const hasSafariToken = /Safari\//.test(agent);
    if (isAppleWebKit && !hasSafariToken && !isKnownIOSBrowser) {
      return { isInApp: true, isIOS, isAndroid };
    }
  }

  // 3. Android webview heuristic: the standard Android System WebView tags the
  //    UA with ";wv)".
  if (isAndroid && /;\s?wv\)/.test(agent)) {
    return { isInApp: true, isIOS, isAndroid };
  }

  return { isInApp: false, isIOS, isAndroid };
}

/**
 * Attempt to escape the in-app browser into the real system browser.
 *
 * Android: build an `intent://` URL that asks Chrome to open the page, with the
 * original URL as the fallback. Returns true (the navigation was attempted).
 *
 * iOS: there is no reliable silent escape from a WKWebView, so this returns
 * false and the caller should show manual instructions instead.
 */
export function escapeToSystemBrowser(url: string): boolean {
  const info = detectInAppBrowser();

  if (info.isAndroid) {
    try {
      const parsed = new URL(url);
      const hostAndPath = `${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
      const fallback = encodeURIComponent(url);
      const intentUrl =
        `intent://${hostAndPath}#Intent;scheme=https;` +
        `package=com.android.chrome;` +
        `S.browser_fallback_url=${fallback};end`;
      if (typeof window !== "undefined") {
        window.location.href = intentUrl;
      }
      return true;
    } catch {
      return false;
    }
  }

  // iOS (and anything else): no reliable silent escape.
  return false;
}

/** Copy a URL to the clipboard, with a legacy execCommand fallback. */
export async function copyLink(url: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // fall through to legacy path
  }

  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = url;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
