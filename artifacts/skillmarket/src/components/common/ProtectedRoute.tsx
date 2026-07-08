import { type ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "../../contexts/AuthContext";

interface Props {
  children: ReactNode;
  role?: "freelancer" | "client";
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, role, adminOnly }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Redirect to="/login" />;
  if (adminOnly && user.role !== "admin") return <Redirect to="/" />;
  if (role && user.role !== role) return <Redirect to="/" />;

  return <>{children}</>;
}
