import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Eye, EyeOff, UserPlus, Briefcase, GraduationCap } from "lucide-react";
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

  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    try {
      const res = await registerMutation.mutateAsync({ data: { name: form.name, email: form.email, password: form.password, role: form.role, university: form.university || undefined } });
      login(res.token, res.user as Parameters<typeof login>[1]);
      navigate(form.role === "client" ? "/dashboard/client" : "/dashboard");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed";
      setError(msg);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">S</div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join the SkillMarket community for free</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["freelancer", "client"] as const).map(role => (
              <button key={role} type="button" onClick={() => setForm(f => ({ ...f, role }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${form.role === role ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-100 text-gray-500 hover:border-gray-200"}`}>
                {role === "freelancer" ? <GraduationCap size={22} /> : <Briefcase size={22} />}
                <span className="font-medium text-sm capitalize">{role === "freelancer" ? "I'm a Freelancer" : "I'm Hiring"}</span>
              </button>
            ))}
          </div>

          {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="Your full name" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input pr-12" placeholder="Min. 6 characters" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
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
            <button type="submit" disabled={registerMutation.isPending} className="btn-primary w-full justify-center py-3.5 mt-2">
              {registerMutation.isPending ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-4">By joining, you agree to our Terms of Service and Privacy Policy.</p>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:text-indigo-800">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
