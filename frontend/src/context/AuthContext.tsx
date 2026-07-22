import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isAxiosError } from "axios";
import api from "../lib/api";
import { getToken, removeToken, setToken } from "../lib/auth";
import type { User } from "../types/models";

interface AuthTokenResponse {
  token: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithGoogleAccessToken: (accessToken: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isUnauthorized(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 401;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

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
    } catch (err) {
      if (issuedToken && isUnauthorized(err) && getToken() === issuedToken) {
        removeToken();
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
    } catch (err) {
      if (issuedToken && isUnauthorized(err) && getToken() === issuedToken) {
        removeToken();
      }
      throw err;
    } finally {
      setSigningIn(false);
    }
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
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signingIn, loginWithGoogle, loginWithGoogleAccessToken, logout, setUser, refreshUser, loginModalOpen, openLoginModal, closeLoginModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
