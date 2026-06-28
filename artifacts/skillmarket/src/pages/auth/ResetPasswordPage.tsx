import { useState, useEffect } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { Eye, EyeOff, KeyRound, CheckCircle, XCircle } from "lucide-react";

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
    if (score <= 1) return { label: "Weak", color: "bg-red-400", width: "25%" };
    if (score === 2) return { label: "Fair", color: "bg-amber-400", width: "50%" };
    if (score === 3) return { label: "Good", color: "bg-blue-400", width: "75%" };
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
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <KeyRound size={26} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
          <p className="text-gray-500 mt-1">
            {tokenEmail ? `Resetting password for ${tokenEmail}` : "Choose a strong password"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {tokenStatus === "checking" ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="animate-spin w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full" />
              <p className="text-sm text-gray-500">Verifying your reset link…</p>
            </div>
          ) : tokenStatus === "invalid" ? (
            <div className="text-center py-6 space-y-4">
              <XCircle size={40} className="text-red-400 mx-auto" />
              <div>
                <p className="font-semibold text-gray-900">Invalid reset link</p>
                <p className="text-sm text-gray-500 mt-1">This link is invalid or has already been used.</p>
              </div>
              <Link href="/forgot-password" className="btn-primary inline-flex mx-auto px-6 py-2.5">
                Request a new link
              </Link>
            </div>
          ) : tokenStatus === "expired" ? (
            <div className="text-center py-6 space-y-4">
              <XCircle size={40} className="text-amber-400 mx-auto" />
              <div>
                <p className="font-semibold text-gray-900">Link expired</p>
                <p className="text-sm text-gray-500 mt-1">This reset link expired after 1 hour. Please request a new one.</p>
              </div>
              <Link href="/forgot-password" className="btn-primary inline-flex mx-auto px-6 py-2.5">
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="text-center py-6 space-y-4">
              <CheckCircle size={40} className="text-green-500 mx-auto" />
              <div>
                <p className="font-semibold text-gray-900">Password reset!</p>
                <p className="text-sm text-gray-500 mt-1">Your password has been updated. Redirecting you to sign in…</p>
              </div>
              <Link href="/login" className="btn-primary inline-flex mx-auto px-6 py-2.5">
                Sign In Now
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">New password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="input pr-12"
                      placeholder="At least 8 characters"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Strength: <span className="font-medium">{strength.label}</span>
                        <span className="text-gray-400"> · min. 8 chars, 1 letter, 1 number</span>
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirm new password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="input pr-12"
                      placeholder="Repeat your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirm && password && (
                    <p className={`text-xs mt-1.5 ${confirm === password ? "text-green-600" : "text-red-500"}`}>
                      {confirm === password ? "✓ Passwords match" : "Passwords do not match"}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  {loading
                    ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    : "Reset Password"}
                </button>
              </form>
            </>
          )}

          {tokenStatus !== "checking" && !done && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                ← Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
