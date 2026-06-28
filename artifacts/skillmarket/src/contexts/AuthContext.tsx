import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: "freelancer" | "client";
  university?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  // S2: token is kept in the interface for backward compat but is always null.
  // Auth is handled by an httpOnly cookie — not accessible to JavaScript.
  token: null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Restore display data from localStorage immediately for a fast initial render,
    // then verify the session cookie is still valid with the server.
    const storedUser = localStorage.getItem("sm_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("sm_user");
      }
    }

    // Verify the httpOnly session cookie is still valid
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (res) => {
        if (res.ok) {
          const freshUser: AuthUser = await res.json();
          localStorage.setItem("sm_user", JSON.stringify(freshUser));
          setUser(freshUser);
        } else {
          // Cookie expired or invalid — clear stale local state
          localStorage.removeItem("sm_user");
          setUser(null);
        }
      })
      .catch(() => {
        // Network error — keep local state so offline UX is graceful
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback((_token: string, newUser: AuthUser) => {
    // S2: Cookie is set by the server response — we only persist display data here.
    localStorage.setItem("sm_user", JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    // S2: Call logout endpoint so the server clears the httpOnly cookie
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore network errors during logout
    }
    localStorage.removeItem("sm_user");
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = useCallback((updated: AuthUser) => {
    localStorage.setItem("sm_user", JSON.stringify(updated));
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token: null, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
