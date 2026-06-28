import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

type Status = "verifying" | "success" | "expired" | "invalid" | "already_verified";

export default function VerifyEmailPage() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const { user, updateUser } = useAuth();

  const token = new URLSearchParams(search).get("token");

  const [status, setStatus] = useState<Status>(token ? "verifying" : "invalid");
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setEmail(data.email ?? "");
          setStatus("success");
          // Update auth context so emailVerified reflects immediately
          if (user) updateUser({ ...user, emailVerified: true });
        } else if (data?.code === "TOKEN_EXPIRED") {
          setStatus("expired");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleResend = async () => {
    setResending(true);
    setResendMessage("");
    setResendError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResendMessage(data.message ?? "Verification email sent. Please check your inbox.");
      } else {
        setResendError(data.error ?? "Failed to resend email. Please try again.");
      }
    } catch {
      setResendError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-md animate-in">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center relative overflow-hidden">
          
          {status === "verifying" && (
            <div className="animate-in">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="text-indigo-600 animate-spin" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Verifying your email</h1>
              <p className="text-gray-500 text-sm">Just a moment while we securely confirm your address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="animate-in">
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Email verified!</h1>
              {email && <p className="font-medium text-gray-900 bg-gray-50 py-1.5 px-4 rounded-lg inline-block mb-6">{email}</p>}
              <p className="text-gray-500 text-sm mb-8">Your email address has been confirmed. You now have full access to SkillMarket AI.</p>
              <button
                onClick={() => navigate(user?.role === "client" ? "/dashboard/client" : "/dashboard")}
                className="btn-primary w-full py-3 shadow-sm"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {status === "expired" && (
            <div className="animate-in">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="text-amber-600" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Link expired</h1>
              <p className="text-gray-500 text-sm mb-8">This verification link has expired (links are valid for 24 hours). Request a new one to continue.</p>
              
              {user ? (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="btn-primary w-full py-3 shadow-sm"
                  >
                    {resending ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    {resending ? "Sending…" : "Resend Verification Email"}
                  </button>
                  {resendMessage && <p className="text-green-700 text-sm font-medium mt-3 bg-green-50 py-2 px-3 rounded-md">{resendMessage}</p>}
                  {resendError && <p className="text-red-700 text-sm font-medium mt-3 bg-red-50 py-2 px-3 rounded-md">{resendError}</p>}
                </div>
              ) : (
                <button onClick={() => navigate("/login")} className="btn-primary w-full py-3 shadow-sm">
                  Sign in to resend
                </button>
              )}
            </div>
          )}

          {status === "invalid" && (
            <div className="animate-in">
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="text-red-600" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Invalid link</h1>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                {token
                  ? "This verification link is invalid or has already been used."
                  : "No verification token provided. Please use the exact link from your email."}
              </p>
              
              {user && !user.emailVerified && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-6">
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="btn-primary w-full py-3 shadow-sm"
                  >
                    {resending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                    {resending ? "Sending…" : "Resend Verification Email"}
                  </button>
                  {resendMessage && <p className="text-green-700 text-sm font-medium mt-3 bg-green-50 py-2 px-3 rounded-md">{resendMessage}</p>}
                  {resendError && <p className="text-red-700 text-sm font-medium mt-3 bg-red-50 py-2 px-3 rounded-md">{resendError}</p>}
                </div>
              )}
              
              <button onClick={() => navigate("/")} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={16} /> Back to home
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
