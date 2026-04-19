import axios from "axios";

export const API_BASE =
  typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost:5032"
    : "";

export function getStoredSession() {
  const raw = localStorage.getItem("silveria_auth");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem("silveria_auth");
    return null;
  }
}

export const http = axios.create({
  baseURL: API_BASE,
});

http.interceptors.request.use((config) => {
  const session = getStoredSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

export function extractApiError(error, fallbackMessage = "Något gick fel.") {
  const payload = error?.response?.data;
  if (typeof payload === "string") {
    return payload;
  }

  if (payload?.message) {
    return payload.message;
  }

  if (Array.isArray(payload?.errors)) {
    return payload.errors.join(", ");
  }

  if (payload?.errors && typeof payload.errors === "object") {
    return Object.values(payload.errors).flat().join(", ");
  }

  return error?.message ?? fallbackMessage;
}

export function toAbsoluteImageUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  return `${API_BASE}${imageUrl}`;
}
