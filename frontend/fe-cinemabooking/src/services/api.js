const TOKEN_KEY = "cinematix_token";

const buildUrl = (path, params) => {
  const url = new URL(`/api${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return `${url.pathname}${url.search}`;
};

const request = async (method, path, body, config = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(config.headers || {}),
  };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(buildUrl(path, config.params), {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Permintaan ke server gagal");
    error.response = { status: response.status, data };
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem("cinematix_user");

      // 👇 Jangan auto-redirect jika request-nya adalah '/auth/me'
      // Biarkan Frontend (React) yang menangani UX-nya melalui try-catch
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/admin/login") &&
        !path.includes("/auth/me") // Tambahkan pengecualian ini
      ) {
        window.location.href = "/login";
      }
    }
    throw error;
  }
  return { data };
};

const api = {
  get: (path, config) => request("GET", path, undefined, config),
  post: (path, body, config) => request("POST", path, body, config),
  put: (path, body, config) => request("PUT", path, body, config),
  delete: (path, config) => request("DELETE", path, undefined, config),
};

export const saveToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);
export const getToken = () => localStorage.getItem(TOKEN_KEY);

export default api;
