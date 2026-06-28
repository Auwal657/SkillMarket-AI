import { useState, useEffect } from "react";
import { Lock, CheckCircle, Clock, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { cn } from "../../lib/utils";

interface EscrowState {
  exists: boolean;
  status: string | null;
  amount: string | number | null;
  escrow?: {
    id: number;
    status: string;
    amount: string;
    fundedAt: string | null;
    releasedAt: string | null;
    paystackAuthorizationUrl: string | null;
  };
  invoiceNumber?: string | null;
}

interface Props {
  projectId: number;
  projectStatus: string;
  isClient: boolean;
  isFreelancer: boolean;
}

const statusConfig: Record<string, { icon: typeof Lock; color: string; label: string; desc: string }> = {
  pending: {
    icon: Clock,
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    label: "Payment Pending",
    desc: "Payment has been initialized but not yet completed.",
  },
  funded: {
    icon: Lock,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    label: "Payment Initiated",
    desc: "Payment is being processed.",
  },
  in_escrow: {
    icon: Lock,
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    label: "In Escrow 🔒",
    desc: "Funds are securely held in escrow and will be released when the project is completed.",
  },
  released: {
    icon: CheckCircle,
    color: "text-green-600 bg-green-50 border-green-200",
    label: "Payment Released ✅",
    desc: "Payment has been released to the freelancer.",
  },
  refunded: {
    icon: RefreshCw,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    label: "Refunded",
    desc: "The payment has been refunded to the client.",
  },
  cancelled: {
    icon: AlertCircle,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    label: "Cancelled",
    desc: "The escrow was cancelled.",
  },
};

export default function EscrowPanel({ projectId, projectStatus, isClient, isFreelancer }: Props) {
  const [escrow, setEscrow] = useState<EscrowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payments/escrow/${projectId}`, { credentials: "include" });
      if (res.ok) setEscrow(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [projectId]);

  const handleFundEscrow = async () => {
    setInitiating(true); setError("");
    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to initialize payment"); setInitiating(false); return; }

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else if (data.devMode) {
        // Dev mode: simulate funding
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: data.reference }),
        });
        if (verifyRes.ok) { await load(); }
        else { const d = await verifyRes.json(); setError(d.error ?? "Verification failed"); }
        setInitiating(false);
      }
    } catch { setError("Network error. Please try again."); setInitiating(false); }
  };

  if (loading) return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-32 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-48" />
    </div>
  );

  // Don't show for non-in-progress projects unless escrow exists
  if (!escrow?.exists && projectStatus === "open") return null;
  if (!escrow?.exists && projectStatus === "completed") return null;

  const statusInfo = escrow?.escrow?.status ? statusConfig[escrow.escrow.status] : null;
  const amount = escrow?.escrow?.amount ?? escrow?.amount;
  const parsedAmount = amount ? parseFloat(String(amount)) : 0;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Lock size={15} className="text-indigo-600" />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">Escrow Payment</h3>
      </div>

      {/* Amount */}
      {parsedAmount > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Project Value</p>
          <p className="text-2xl font-bold text-gray-900">₦{parsedAmount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
        </div>
      )}

      {/* Status */}
      {statusInfo && (
        <div className={cn("flex items-start gap-2 p-3 rounded-xl border mb-4 text-sm", statusInfo.color)}>
          <statusInfo.icon size={15} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">{statusInfo.label}</p>
            <p className="opacity-80 text-xs mt-0.5">{statusInfo.desc}</p>
          </div>
        </div>
      )}

      {/* Invoice link */}
      {escrow?.invoiceNumber && (
        <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
          <span>Invoice:</span>
          <Link href={`/invoices/${escrow.escrow?.id ?? ""}`} className="text-indigo-600 hover:underline font-mono">{escrow.invoiceNumber}</Link>
        </p>
      )}

      {/* Error */}
      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">{error}</div>}

      {/* Actions */}
      {isClient && !escrow?.exists && projectStatus === "in_progress" && (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Fund the escrow before work begins. Payment is securely held until you mark the project complete.
          </p>
          <button onClick={handleFundEscrow} disabled={initiating} className="btn-primary w-full justify-center text-sm py-2.5">
            <Lock size={14} />
            {initiating ? "Redirecting to payment…" : "Fund Escrow"}
          </button>
        </div>
      )}

      {isClient && escrow?.exists && escrow.escrow?.status === "pending" && escrow.escrow.paystackAuthorizationUrl && (
        <a href={escrow.escrow.paystackAuthorizationUrl} className="btn-primary w-full justify-center text-sm py-2.5 block text-center">
          <ExternalLink size={14} /> Complete Payment
        </a>
      )}

      {isClient && escrow?.exists && escrow.escrow?.status === "pending" && !escrow.escrow.paystackAuthorizationUrl && (
        <button onClick={handleFundEscrow} disabled={initiating} className="btn-secondary w-full justify-center text-sm py-2.5">
          {initiating ? "Processing…" : "Retry Payment"}
        </button>
      )}

      {isFreelancer && escrow?.exists && escrow.escrow?.status === "in_escrow" && (
        <p className="text-xs text-green-700 bg-green-50 rounded-xl p-3 flex items-center gap-1.5">
          <CheckCircle size={13} /> Your payment is secured. Complete the project to receive funds.
        </p>
      )}

      {isFreelancer && (!escrow?.exists || !["in_escrow", "released"].includes(escrow.escrow?.status ?? "")) && projectStatus === "in_progress" && (
        <p className="text-xs text-yellow-700 bg-yellow-50 rounded-xl p-3 flex items-center gap-1.5">
          <AlertCircle size={13} /> Client has not yet funded the escrow. You may want to follow up before starting work.
        </p>
      )}

      <Link href="/wallet" className="block text-center text-xs text-indigo-600 hover:text-indigo-800 mt-3">
        View Wallet →
      </Link>
    </div>
  );
}
