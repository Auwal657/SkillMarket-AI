import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type State = "verifying" | "success" | "error";

export default function PaymentCallbackPage() {
  const [, navigate] = useLocation();
  const [state, setState] = useState<State>("verifying");
  const [message, setMessage] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") || params.get("trxref");

    if (!reference) {
      setState("error");
      setMessage("No payment reference found. The payment may have been cancelled.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/payments/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();
        if (res.ok) {
          setState("success");
          setMessage(`Payment verified! Escrow of ₦${parseFloat(data.escrow?.amount ?? "0").toLocaleString()} is now secured. Invoice: ${data.invoiceNumber ?? ""}`);
          setProjectId(data.escrow?.projectId ?? null);
        } else {
          setState("error");
          setMessage(data.error ?? "Payment verification failed.");
        }
      } catch {
        setState("error");
        setMessage("Network error during verification. Please check your wallet.");
      }
    })();
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full card p-10 text-center">
        {state === "verifying" && (
          <>
            <Loader2 size={48} className="mx-auto mb-4 text-indigo-600 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-500">Please wait while we confirm your payment with Paystack…</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6 text-sm">{message}</p>
            <div className="flex flex-col gap-3">
              {projectId && (
                <button onClick={() => navigate(`/projects/${projectId}`)} className="btn-primary w-full justify-center">
                  View Project
                </button>
              )}
              <button onClick={() => navigate("/wallet")} className="btn-secondary w-full justify-center">
                Go to Wallet
              </button>
            </div>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment Issue</h2>
            <p className="text-gray-600 mb-6 text-sm">{message}</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate("/wallet")} className="btn-primary w-full justify-center">
                Check Wallet
              </button>
              <button onClick={() => navigate("/my-projects")} className="btn-secondary w-full justify-center">
                My Projects
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
