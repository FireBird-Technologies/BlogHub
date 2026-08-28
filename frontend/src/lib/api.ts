import axios, { isAxiosError } from "axios";
import { getToken, removeToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

declare module "axios" {
  interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

function getAuthorizationHeader(headers: unknown): string | undefined {
  if (!headers || typeof headers !== "object") return undefined;
  const record = headers as Record<string, unknown>;
  const value = record.Authorization ?? record.authorization;
  return typeof value === "string" ? value : undefined;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Account states the backend reports as a 403 with a machine-readable `code`. */
export type AccountStatusCode = "inactive" | "blocked";

type AccountStatusListener = (status: AccountStatusCode) => void;

const accountStatusListeners = new Set<AccountStatusListener>();

/** Subscribe to blocked/deactivated responses. Returns an unsubscribe function.
 *  Lives here rather than in AuthContext so the interceptor doesn't have to import
 *  React state (which would make the two modules circular). */
export function onAccountStatusError(listener: AccountStatusListener): () => void {
  accountStatusListeners.add(listener);
  return () => {
    accountStatusListeners.delete(listener);
  };
}

function readAccountStatus(error: unknown): AccountStatusCode | null {
  if (!isAxiosError(error) || error.response?.status !== 403) return null;
  const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
  const code =
    detail && typeof detail === "object" ? (detail as { code?: unknown }).code : undefined;
  if (code === "account_blocked") return "blocked";
  if (code === "account_inactive") return "inactive";
  return null;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 403 on an already-authenticated request means the account was blocked or
    // deleted out from under this session. The login/reactivate calls opt out via
    // skipAuthRedirect — they handle the same 403 themselves.
    const accountStatus = readAccountStatus(error);
    if (accountStatus && !error.config?.skipAuthRedirect) {
      accountStatusListeners.forEach((listener) => listener(accountStatus));
    }
    if (isAxiosError(error) && error.response?.status === 401 && !error.config?.skipAuthRedirect) {
      const requestAuth = getAuthorizationHeader(error.config?.headers);
      const currentToken = getToken();
      const currentAuth = currentToken ? `Bearer ${currentToken}` : undefined;
      if (requestAuth && requestAuth === currentAuth) {
        removeToken();
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiErrorDetail(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { detail?: unknown } | undefined;
    const d = data?.detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) {
      return d
        .map((x) => (typeof (x as { msg?: string })?.msg === "string" ? (x as { msg: string }).msg : JSON.stringify(x)))
        .join(" ");
    }
    // Structured details (e.g. the account_blocked 403) carry their prose in `message`.
    if (d && typeof d === "object") {
      const message = (d as { message?: unknown }).message;
      if (typeof message === "string" && message) return message;
    }
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export { API_URL };
export default api;
