import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft, KeyRound, Copy, Check } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [copied, setCopied] = useState(false);

  const resetLink = resetToken
    ? `${window.location.origin}/reset-password?token=${resetToken}`
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResetToken(data.token);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resetLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-md animate-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6 shadow-sm border border-indigo-100">
            <KeyRound size={26} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reset password</h1>
          <p className="text-gray-500 mt-2">Enter your email and we'll send you a link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {!resetToken ? (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6 animate-in">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input pl-11"
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base shadow-sm mt-2"
                >
                  {loading
                    ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="space-y-6 animate-in">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <Check size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Check your email</p>
                  <p className="text-sm text-green-800 mt-1 leading-relaxed">
                    In production this would be emailed to <strong>{email}</strong>. For this demo, use the link below.
                  </p>
                </div>
              </div>

              <div>
                <label className="label text-xs uppercase tracking-wider text-gray-500">Your reset link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={resetLink}
                    className="input flex-1 text-sm font-mono bg-gray-50 text-gray-600 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="Copy link"
                    className="flex-shrink-0 p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <Link
                href={`/reset-password?token=${resetToken}`}
                className="btn-primary w-full py-3 text-center block shadow-sm"
              >
                Reset Password Now
              </Link>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft size={16} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
