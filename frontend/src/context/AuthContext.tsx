import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
  logout: () => void;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
      .get<User>("/api/me")
      .then((res) => setUser(res.data))
      .catch(() => removeToken())
      .finally(() => setLoading(false));
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    setSigningIn(true);
    try {
      const res = await api.post<AuthTokenResponse>("/auth/google/id-token", { id_token: idToken });
      setToken(res.data.token);
      const me = await api.get<User>("/api/me");
      setUser(me.data);
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
      const res = await api.get<User>("/api/me");
      setUser(res.data);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signingIn, loginWithGoogle, logout, setUser, refreshUser, loginModalOpen, openLoginModal, closeLoginModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
