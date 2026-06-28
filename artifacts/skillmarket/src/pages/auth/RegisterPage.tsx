import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Eye, EyeOff, Briefcase, GraduationCap, Mail, ArrowRight } from "lucide-react";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultRole = params.get("role") === "client" ? "client" : "freelancer";

  const [form, setForm] = useState({ name: "", email: "", password: "", role: defaultRole as "freelancer" | "client", university: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredRole, setRegisteredRole] = useState<"freelancer" | "client">("freelancer");

  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    try {
      const res = await registerMutation.mutateAsync({ data: { name: form.name, email: form.email, password: form.password, role: form.role, university: form.university || undefined } });
      login(res.token, res.user as Parameters<typeof login>[1]);
      setRegisteredEmail(form.email);
      setRegisteredRole(form.role);
      setRegistered(true);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed";
      setError(msg);
    }
  };

  if (registered) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50">
        <div className="w-full max-w-md animate-in">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="text-indigo-600" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Check your inbox</h1>
            <p className="text-gray-500 text-sm mb-2">We sent a verification link to</p>
            <p className="font-semibold text-gray-900 bg-gray-50 py-2 px-4 rounded-lg inline-block mb-6">{registeredEmail}</p>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">Click the link in that email to verify your account and unlock all features. The link expires in 24 hours.</p>
            <button
              onClick={() => navigate(registeredRole === "client" ? "/dashboard/client" : "/dashboard")}
              className="btn-primary w-full py-3 shadow-sm"
            >
              Continue to Dashboard
            </button>
            <p className="text-xs text-gray-400 mt-6">Didn't receive it? Check your spam folder or resend it from the banner on your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-gray-50 relative flex-col justify-between p-12 border-r border-gray-200">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-gray-900">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-sm shadow-sm">S</div>
            SkillMarket AI
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-5 h-5 bg-amber-400 text-white flex items-center justify-center rounded-sm text-xs font-bold">★</div>)}
            </div>
            <p className="text-gray-700 leading-relaxed font-medium mb-4">
              "SkillMarket AI matched me with my first real client in 48 hours. The quality of work and the ease of the platform is unmatched."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">AB</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Aisha Bello</p>
                <p className="text-xs text-gray-500">Computer Science Student</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative">
        <div className="w-full max-w-md animate-in">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create your account</h1>
            <p className="text-gray-500 mt-2">Join the SkillMarket community</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {(["freelancer", "client"] as const).map(role => (
              <button 
                key={role} 
                type="button" 
                onClick={() => setForm(f => ({ ...f, role }))}
                className={`flex flex-col items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${form.role === role ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm ring-1 ring-indigo-600 ring-offset-1" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}
              >
                <div className={`p-2 rounded-lg ${form.role === role ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {role === "freelancer" ? <GraduationCap size={20} /> : <Briefcase size={20} />}
                </div>
                <div>
                  <span className="font-semibold block">{role === "freelancer" ? "I'm a Freelancer" : "I'm Hiring"}</span>
                  <span className="text-xs opacity-80 mt-0.5 block">{role === "freelancer" ? "Find work" : "Post projects"}</span>
                </div>
              </button>
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6 animate-in">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="First and last name" required />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input pr-12" placeholder="Min. 6 characters" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {form.role === "freelancer" && (
              <div>
                <label className="label">University / School <span className="text-gray-400 font-normal">(optional)</span></label>
                <input value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} className="input" placeholder="e.g. University of Lagos" />
              </div>
            )}
            
            <button type="submit" disabled={registerMutation.isPending} className="btn-primary w-full py-3.5 mt-4 text-base shadow-sm">
              {registerMutation.isPending ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : "Create Account"}
            </button>
          </form>
          
          <p className="text-center text-xs text-gray-400 mt-6 max-w-sm mx-auto">
            By joining, you agree to our Terms of Service and Privacy Policy.
          </p>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 inline-flex items-center gap-1 group">
              Sign in <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
