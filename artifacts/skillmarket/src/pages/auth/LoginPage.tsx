import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, LogIn, ArrowRight } from "lucide-react";
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
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-900 opacity-90" />
        <div className="absolute -left-20 -top-20 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 w-[600px] h-[600px] rounded-full bg-indigo-400/20 blur-3xl" />
        
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-white">
            <div className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center text-sm shadow-sm">S</div>
            SkillMarket AI
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold leading-tight mb-6">Build your future. <br/><span className="text-indigo-200">Ship real work.</span></h1>
          <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
            The marketplace where ambitious talent connects with world-class clients to build things that matter.
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-indigo-100">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-indigo-400 flex items-center justify-center">AJ</div>
              <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-purple-400 flex items-center justify-center">MK</div>
              <div className="w-10 h-10 rounded-full border-2 border-indigo-600 bg-pink-400 flex items-center justify-center">TS</div>
            </div>
            <p>Join 10,000+ top talents</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50 lg:bg-white relative">
        <div className="w-full max-w-md animate-in">
          <div className="lg:hidden text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-sm">S</div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 mt-2 text-sm">Sign in to your SkillMarket account</p>
          </div>

          <div className="hidden lg:block mb-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Sign in</h1>
            <p className="text-gray-500 mt-2">Welcome back to SkillMarket AI</p>
          </div>

          <div className="bg-white lg:bg-transparent rounded-2xl shadow-sm lg:shadow-none border border-gray-100 lg:border-transparent p-6 sm:p-8 lg:p-0">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6 animate-in">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  <Link href="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Forgot Password?</Link>
                </div>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="input pr-12" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loginMutation.isPending} className="btn-primary w-full py-3 mt-2 text-base shadow-sm">
                {loginMutation.isPending ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : "Sign In"}
              </button>
            </form>
            
            <div className="mt-8 text-center text-sm text-gray-500">
              New to SkillMarket?{" "}
              <Link href="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 inline-flex items-center gap-1 group">
                Create an account <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="mt-10 p-5 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-sm text-gray-600">
            <p className="font-semibold text-indigo-900 mb-3 text-xs uppercase tracking-wider">Demo Accounts</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-100">
                <span className="text-gray-500">Freelancer</span>
                <div className="font-mono text-xs">alex@demo.com / demo1234</div>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-100">
                <span className="text-gray-500">Client</span>
                <div className="font-mono text-xs">client1@demo.com / demo1234</div>
              </div>
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-100">
                <span className="text-gray-500">Admin</span>
                <div className="font-mono text-xs">alex@demo.com / demo1234</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
