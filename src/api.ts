const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export function apiUrl(path: string): string {
  if (!apiBaseUrl) {
    throw new Error("VITE_API_URL is not configured for this deployment.");
  }

  return `${apiBaseUrl}/${path.replace(/^\//, "")}`;
}
