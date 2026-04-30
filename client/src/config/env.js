function normalizeBaseUrl(value, fallback) {
  return (value || fallback).replace(/\/+$/, "");
}

export const clientEnv = Object.freeze({
  apiUrl: normalizeBaseUrl(import.meta.env.VITE_API_URL, "http://localhost:4000"),
  socketUrl: normalizeBaseUrl(
    import.meta.env.VITE_SOCKET_URL,
    import.meta.env.VITE_API_URL || "http://localhost:4000"
  ),
  apiKey: import.meta.env.VITE_API_KEY || "development-api-key"
});
