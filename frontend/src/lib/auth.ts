const TOKEN_KEY = "bloghub_token";

let memoryToken: string | null = null;

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? memoryToken;
  } catch {
    return memoryToken;
  }
};

export const setToken = (token: string): void => {
  memoryToken = token;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Some mobile/private browser modes block storage; keep the session in memory.
  }
};

export const removeToken = (): void => {
  memoryToken = null;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore unavailable storage */
  }
};

export const isAuthenticated = (): boolean => !!getToken();
