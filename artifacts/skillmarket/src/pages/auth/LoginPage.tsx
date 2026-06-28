import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } });
      login(res.token, res.user as Parameters<typeof login>[1]);
      const role = res.user.role;
      navigate(role === "client" ? "/dashboard/client" : "/dashboard");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Invalid email or password";
      setError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">S</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your SkillMarket account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Password</label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="input pr-12" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loginMutation.isPending} className="btn-primary w-full justify-center py-3.5">
              {loginMutation.isPending ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><LogIn size={18} /> Sign In</>}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:text-indigo-800">Create one free</Link>
          </p>
        </div>

        <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-gray-600">
          <p className="font-medium text-indigo-800 mb-2">Demo Accounts</p>
          <p>Freelancer: <code className="bg-white px-1 py-0.5 rounded">freelancer@demo.com</code> / <code className="bg-white px-1 py-0.5 rounded">demo123</code></p>
          <p className="mt-1">Client: <code className="bg-white px-1 py-0.5 rounded">client@demo.com</code> / <code className="bg-white px-1 py-0.5 rounded">demo123</code></p>
        </div>
      </div>
    </div>
  );
}
