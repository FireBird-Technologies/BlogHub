import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isAxiosError } from "axios";
import api, { onAccountStatusError } from "../lib/api";
import { getToken, removeToken, setToken } from "../lib/auth";
import type { User } from "../types/models";

interface AuthTokenResponse {
  token: string;
}

/** Which account-state screen to show instead of a signed-in session. */
export type AccountStatus = "inactive" | "blocked";

/** The Google credential that was rejected, kept so reactivation can re-present it. */
type PendingCredential =
  | { kind: "id_token"; value: string }
  | { kind: "access_token"; value: string };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  /** Resolves true when a session was established. False means the sign-in was
   *  diverted (a deactivated account showing the reactivation prompt), so callers
   *  must NOT navigate as though the user were signed in. */
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  loginWithGoogleAccessToken: (accessToken: string) => Promise<boolean>;
  logout: () => void;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  accountStatus: AccountStatus | null;
  /** True only when we still hold the credential needed to call /auth/reactivate. */
  canReactivate: boolean;
  reactivating: boolean;
  reactivateAccount: () => Promise<void>;
  dismissAccountStatus: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isUnauthorized(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 401;
}

/** Read the `code` the backend attaches to a 403 for a blocked/deleted account. */
export function accountStatusFromError(err: unknown): AccountStatus | null {
  if (!isAxiosError(err) || err.response?.status !== 403) return null;
  const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
  const code =
    detail && typeof detail === "object"
      ? (detail as { code?: unknown }).code
      : undefined;
  if (code === "account_blocked") return "blocked";
  if (code === "account_inactive") return "inactive";
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [pendingCredential, setPendingCredential] = useState<PendingCredential | null>(null);
  const [reactivating, setReactivating] = useState(false);

  const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<User>("/api/me", { skipAuthRedirect: true })
      .then((res) => setUser(res.data))
      .catch((err) => {
        if (isUnauthorized(err) && getToken() === token) {
          removeToken();
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    setSigningIn(true);
    let issuedToken: string | null = null;
    try {
      const res = await api.post<AuthTokenResponse>(
        "/auth/google/id-token",
        { id_token: idToken },
        { skipAuthRedirect: true }
      );
      issuedToken = res.data.token;
      setToken(issuedToken);
      const me = await api.get<User>("/api/me", { skipAuthRedirect: true });
      setUser(me.data);
      return true;
    } catch (err) {
      if (issuedToken && isUnauthorized(err) && getToken() === issuedToken) {
        removeToken();
      }
      // Neither a blocked nor a self-deleted account is an error to report under the
      // sign-in button — both get their own modal. The credential is kept so the
      // deactivated case can reuse it for reactivation.
      const status = accountStatusFromError(err);
      if (status) {
        setPendingCredential({ kind: "id_token", value: idToken });
        setAccountStatus(status);
        setLoginModalOpen(false);
        return false;
      }
      throw err;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const loginWithGoogleAccessToken = useCallback(async (accessToken: string) => {
    setSigningIn(true);
    let issuedToken: string | null = null;
    try {
      const res = await api.post<AuthTokenResponse>(
        "/auth/google/token",
        { access_token: accessToken },
        { skipAuthRedirect: true }
      );
      issuedToken = res.data.token;
      setToken(issuedToken);
      const me = await api.get<User>("/api/me", { skipAuthRedirect: true });
      setUser(me.data);
      return true;
    } catch (err) {
      if (issuedToken && isUnauthorized(err) && getToken() === issuedToken) {
        removeToken();
      }
      const status = accountStatusFromError(err);
      if (status) {
        setPendingCredential({ kind: "access_token", value: accessToken });
        setAccountStatus(status);
        setLoginModalOpen(false);
        return false;
      }
      throw err;
    } finally {
      setSigningIn(false);
    }
  }, []);

  const reactivateAccount = useCallback(async () => {
    if (!pendingCredential) return;
    setReactivating(true);
    try {
      const body =
        pendingCredential.kind === "id_token"
          ? { id_token: pendingCredential.value }
          : { access_token: pendingCredential.value };
      const res = await api.post<AuthTokenResponse>("/auth/reactivate", body, {
        skipAuthRedirect: true,
      });
      setToken(res.data.token);
      const me = await api.get<User>("/api/me", { skipAuthRedirect: true });
      setUser(me.data);
      setAccountStatus(null);
      setPendingCredential(null);
    } finally {
      setReactivating(false);
    }
  }, [pendingCredential]);

  const dismissAccountStatus = useCallback(() => {
    setAccountStatus(null);
    setPendingCredential(null);
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    window.location.href = "/";
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<User>("/api/me", { skipAuthRedirect: true });
      setUser(res.data);
    } catch (err) {
      if (isUnauthorized(err)) {
        removeToken();
        setUser(null);
      }
      const status = accountStatusFromError(err);
      if (status) {
        removeToken();
        setUser(null);
        setAccountStatus(status);
      }
    }
  }, []);

  // An operator can block a user mid-session. The interceptor spots the 403 on any
  // request and hands it here, so the user gets an explanation rather than a page
  // that has quietly stopped working.
  useEffect(() => {
    return onAccountStatusError((status) => {
      removeToken();
      setUser(null);
      // Nothing to reactivate with: they were already signed in, not signing in.
      setPendingCredential(null);
      setAccountStatus(status);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signingIn, loginWithGoogle, loginWithGoogleAccessToken, logout, setUser, refreshUser, loginModalOpen, openLoginModal, closeLoginModal, accountStatus, canReactivate: pendingCredential !== null, reactivating, reactivateAccount, dismissAccountStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
