const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  if (typeof input === "string" && input.startsWith("/api")) {
    return fetch(`${apiBaseUrl}${input}`, init);
  }
  return fetch(input, init);
}
