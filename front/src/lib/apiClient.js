/**
 * HTTP client scalable — token Sanctum, erreurs normalisées, JSON.
 * Config: VITE_API_URL (ex: http://localhost:8000/api)
 */

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

const TOKEN_KEY = "restohub_token";
const USER_KEY = "restohub_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession({ token, user }) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * @param {string} path - chemin relatif (ex: /auth/login)
 * @param {{ method?: string, body?: any, headers?: Record<string,string>, auth?: boolean }} options
 */
export async function api(path, options = {}) {
  const { method = "GET", body, headers = {}, auth = true } = options;

  const finalHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError(
      "Impossible de contacter le serveur. Vérifiez que l'API Laravel tourne.",
      0,
      { network: true }
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json().catch(() => null) : await response.text();

  if (response.status === 401) {
    clearSession();
    throw new ApiError(data?.message || "Session expirée. Reconnectez-vous.", 401, data);
  }

  if (!response.ok) {
    const message =
      data?.message ||
      (data?.errors && Object.values(data.errors).flat()[0]) ||
      `Erreur ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const apiClient = {
  get: (path, opts) => api(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => api(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => api(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) => api(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => api(path, { ...opts, method: "DELETE" }),
};

export function useMock() {
  return import.meta.env.VITE_USE_MOCK === "true";
}

export { API_URL };
