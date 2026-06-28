import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2, Mail, RefreshCw } from "lucide-react";
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
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">

          {status === "verifying" && (
            <>
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Loader2 className="text-indigo-500 animate-spin" size={32} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Verifying your email…</h1>
              <p className="text-gray-500 text-sm">Just a moment while we confirm your address.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="text-green-500" size={36} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h1>
              {email && <p className="text-gray-500 text-sm mb-1">{email}</p>}
              <p className="text-gray-500 text-sm mb-7">Your email address has been confirmed. You now have full access to SkillMarket AI.</p>
              <button
                onClick={() => navigate(user?.role === "client" ? "/dashboard/client" : "/dashboard")}
                className="btn-primary justify-center w-full py-3"
              >
                Go to Dashboard
              </button>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="text-amber-500" size={36} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Link expired</h1>
              <p className="text-gray-500 text-sm mb-6">This verification link has expired (links are valid for 24 hours). Request a new one below.</p>
              {user ? (
                <>
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="btn-primary justify-center w-full py-3 mb-3"
                  >
                    {resending ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    {resending ? "Sending…" : "Resend Verification Email"}
                  </button>
                  {resendMessage && <p className="text-green-600 text-sm mt-2">{resendMessage}</p>}
                  {resendError && <p className="text-red-600 text-sm mt-2">{resendError}</p>}
                </>
              ) : (
                <button onClick={() => navigate("/login")} className="btn-primary justify-center w-full py-3">
                  Sign in to resend
                </button>
              )}
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="text-red-500" size={36} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid link</h1>
              <p className="text-gray-500 text-sm mb-6">
                {token
                  ? "This verification link is invalid or has already been used."
                  : "No verification token provided. Please use the link from your email."}
              </p>
              {user && !user.emailVerified && (
                <>
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="btn-primary justify-center w-full py-3 mb-3"
                  >
                    {resending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                    {resending ? "Sending…" : "Resend Verification Email"}
                  </button>
                  {resendMessage && <p className="text-green-600 text-sm mt-2">{resendMessage}</p>}
                  {resendError && <p className="text-red-600 text-sm mt-2">{resendError}</p>}
                </>
              )}
              <button onClick={() => navigate("/")} className="text-indigo-600 text-sm font-medium hover:underline mt-2 block">
                Back to home
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
