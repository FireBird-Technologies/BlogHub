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

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export { API_URL };
export default api;
