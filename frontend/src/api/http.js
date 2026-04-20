import axios from "axios";

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== "undefined" && window.location.port === "5173"
      ? "http://localhost:5032"
      : "")).replace(/\/$/, "");

export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
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

  if (!API_BASE) {
    return imageUrl;
  }

  return `${API_BASE}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}