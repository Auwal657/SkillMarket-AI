import { useState, useEffect } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { Eye, EyeOff, KeyRound, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

type TokenStatus = "checking" | "valid" | "invalid" | "expired";

export default function ResetPasswordPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const token = new URLSearchParams(search).get("token") ?? "";

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");
  const [tokenEmail, setTokenEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setTokenStatus("invalid"); return; }

    fetch(`/api/auth/verify-reset-token/${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setTokenStatus("valid");
          setTokenEmail(data.email ?? "");
        } else {
          setTokenStatus(data.reason === "expired" ? "expired" : "invalid");
        }
      })
      .catch(() => setTokenStatus("invalid"));
  }, [token]);

  const passwordStrength = (): { label: string; color: string; width: string } => {
    const p = password;
    if (!p) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (score === 2) return { label: "Fair", color: "bg-amber-500", width: "50%" };
    if (score === 3) return { label: "Good", color: "bg-blue-500", width: "75%" };
    return { label: "Strong", color: "bg-green-500", width: "100%" };
  };

  const strength = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (!/[A-Za-z]/.test(password)) { setError("Password must contain at least one letter"); return; }
    if (!/[0-9]/.test(password)) { setError("Password must contain at least one number"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.toLowerCase().includes("expired")) setTokenStatus("expired");
        setError(data.error ?? "Failed to reset password. Please try again.");
        return;
      }
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-sm border border-indigo-100">
            <KeyRound size={26} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Choose new password</h1>
          <p className="text-gray-500 mt-2">
            {tokenEmail ? `For ${tokenEmail}` : "Make sure it's at least 8 characters"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {tokenStatus === "checking" ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <span className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
              <p className="text-sm font-medium text-gray-600">Verifying link…</p>
            </div>
          ) : tokenStatus === "invalid" ? (
            <div className="text-center py-8 space-y-4 animate-in">
              <XCircle size={48} className="text-red-500 mx-auto mb-2" />
              <div>
                <p className="text-lg font-bold text-gray-900">Invalid link</p>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">This reset link is invalid or has already been used.</p>
              </div>
              <Link href="/forgot-password" className="btn-primary w-full justify-center py-3 mt-4">
                Request a new link
              </Link>
            </div>
          ) : tokenStatus === "expired" ? (
            <div className="text-center py-8 space-y-4 animate-in">
              <XCircle size={48} className="text-amber-500 mx-auto mb-2" />
              <div>
                <p className="text-lg font-bold text-gray-900">Link expired</p>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">This reset link expired after 1 hour. Please request a new one.</p>
              </div>
              <Link href="/forgot-password" className="btn-primary w-full justify-center py-3 mt-4">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center py-8 space-y-4 animate-in">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
              <div>
                <p className="text-lg font-bold text-gray-900">Password reset!</p>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">Your password has been updated successfully. Redirecting you to sign in…</p>
              </div>
              <Link href="/login" className="btn-primary w-full justify-center py-3 mt-4">
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6 animate-in">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input pr-12"
                      placeholder="••••••••"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-3 space-y-2 animate-in">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 flex justify-between">
                        <span className="font-medium text-gray-700">{strength.label}</span>
                        <span>min. 8 chars, 1 letter, 1 number</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="input pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirm && password && (
                    <p className={`text-xs mt-2 font-medium ${confirm === password ? "text-green-600" : "text-red-500"}`}>
                      {confirm === password ? "✓ Passwords match" : "Passwords do not match"}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base shadow-sm mt-2"
                >
                  {loading
                    ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {tokenStatus !== "checking" && !done && (
            <div className="mt-8 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={16} /> Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
