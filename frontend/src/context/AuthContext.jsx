import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { extractApiError, http } from "../api/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const response = await http.get("/api/auth/me");
        if (!ignore) {
          setSession(response.data);
        }
      } catch {
        if (!ignore) {
          setSession(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSession();
    return () => {
      ignore = true;
    };
  }, []);

  async function login(payload) {
    const response = await http.post("/api/auth/login", payload);
    setSession(response.data);
    return response.data;
  }

  async function logout() {
    await http.post("/api/auth/logout");
    setSession(null);
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      isAuthenticated: Boolean(session),
      isAdmin: Boolean(session?.roles?.includes("Admin")),
      userName: session?.fullName ?? "",
      login,
      logout,
      extractApiError,
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
