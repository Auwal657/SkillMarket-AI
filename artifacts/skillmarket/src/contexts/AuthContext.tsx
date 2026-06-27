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
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem("sm_token");
    const storedUser = localStorage.getItem("sm_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("sm_token");
        localStorage.removeItem("sm_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem("sm_token", newToken);
    localStorage.setItem("sm_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sm_token");
    localStorage.removeItem("sm_user");
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const updateUser = useCallback((updated: AuthUser) => {
    localStorage.setItem("sm_user", JSON.stringify(updated));
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
