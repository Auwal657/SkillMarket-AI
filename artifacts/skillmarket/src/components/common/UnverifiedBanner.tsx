import { useState } from "react";
import { MailWarning, RefreshCw, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function UnverifiedBanner() {
  const { user, updateUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.emailVerified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error ?? "Failed to send. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <MailWarning size={17} className="text-amber-600 shrink-0" />
        <p className="text-amber-800 text-sm flex-1">
          <span className="font-medium">Verify your email</span>
          {" — "}Please check your inbox and click the verification link to unlock all features.
          {error && <span className="text-red-600 ml-2">{error}</span>}
          {sent && <span className="text-green-700 ml-2">Email sent! Check your inbox.</span>}
        </p>
        {!sent && (
          <button
            onClick={handleResend}
            disabled={sending}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <RefreshCw size={13} className={sending ? "animate-spin" : ""} />
            {sending ? "Sending…" : "Resend email"}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-500 hover:text-amber-700 ml-1"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
