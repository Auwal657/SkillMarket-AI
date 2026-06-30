import { useState } from "react";
import { MailWarning, RefreshCw, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export default function UnverifiedBanner() {
  const { user, updateUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (!user || user.emailVerified || dismissed || process.env.NODE_ENV !== "production") return null;

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
    <div className="bg-amber-50/80 backdrop-blur-sm border-b border-amber-200/60 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-100 rounded-md">
            <MailWarning size={16} className="text-amber-700 shrink-0" />
          </div>
          <p className="text-amber-900 text-sm">
            <span className="font-semibold">Verify your email address</span>
            <span className="hidden sm:inline"> to unlock all platform features.</span>
            {error && <span className="text-red-600 ml-2 block sm:inline">{error}</span>}
            {sent && <span className="text-green-700 ml-2 block sm:inline">Email sent! Check your inbox.</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto pl-9 sm:pl-0">
          {!sent && (
            <button
              onClick={handleResend}
              disabled={sending}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-200/50 hover:bg-amber-200 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={sending ? "animate-spin" : ""} />
              {sending ? "Sending…" : "Resend Email"}
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-600 hover:text-amber-900 p-1 rounded-md hover:bg-amber-200/50 transition-colors ml-auto sm:ml-0"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
