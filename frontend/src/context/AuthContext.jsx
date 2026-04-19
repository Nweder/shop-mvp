import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { extractApiError, getStoredSession, http } from "../api/http";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getStoredSession());

  useEffect(() => {
    if (session) {
      localStorage.setItem("silveria_auth", JSON.stringify(session));
    } else {
      localStorage.removeItem("silveria_auth");
    }
  }, [session]);

  async function login(payload) {
    const response = await http.post("/api/auth/login", payload);
    setSession(response.data);
    return response.data;
  }

  async function register(payload) {
    const response = await http.post("/api/auth/register", payload);
    setSession(response.data);
    return response.data;
  }

  function logout() {
    setSession(null);
  }

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      isAdmin: Boolean(session?.roles?.includes("Admin")),
      userName: session?.fullName ?? "",
      login,
      register,
      logout,
      extractApiError,
    }),
    [session],
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
