import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Printer, Download, ArrowLeft, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import LoadingSpinner from "../components/common/LoadingSpinner";

interface InvoiceDetail {
  invoice: {
    id: number;
    invoiceNumber: string;
    amount: string;
    type: "escrow_funded" | "escrow_released" | "refund";
    paystackReference: string | null;
    createdAt: string;
  };
  project: { id: number; title: string; description: string; category: string } | null;
  client: { id: number; name: string; email: string; companyName: string | null } | null;
  freelancer: { id: number; name: string; email: string } | null;
  escrow: { id: number; amount: string; status: string; fundedAt: string | null; releasedAt: string | null } | null;
}

const typeConfig = {
  escrow_funded: { label: "Escrow Payment", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
  escrow_released: { label: "Payment Released", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle },
  refund: { label: "Refund", color: "text-orange-700 bg-orange-50 border-orange-200", icon: RefreshCw },
};

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/wallet/invoices/${id}`, { credentials: "include" });
        if (res.ok) setData(await res.json());
        else { const d = await res.json(); setError(d.error ?? "Failed to load invoice"); }
      } catch { setError("Network error"); } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-red-600 mb-4">{error}</p>
      <Link href="/wallet" className="btn-secondary">Back to Wallet</Link>
    </div>
  );
  if (!data) return null;

  const { invoice, project, client, freelancer, escrow } = data;
  const amount = parseFloat(invoice.amount);
  const conf = typeConfig[invoice.type] ?? typeConfig.escrow_funded;
  const Icon = conf.icon;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/wallet" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Back to Wallet
        </Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-ghost text-sm py-2 px-3">
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      <div className="card p-8 print:shadow-none print:border-0">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">S</div>
              <span className="font-bold text-lg text-gray-900">SkillMarket <span className="text-indigo-600">AI</span></span>
            </div>
            <p className="text-xs text-gray-400">Payment Receipt</p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-gray-900 text-sm">{invoice.invoiceNumber}</p>
            <p className="text-xs text-gray-400">{new Date(invoice.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
        </div>

        {/* Status badge */}
        <div className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border mb-6 ${conf.color}`}>
          <Icon size={14} />
          {conf.label}
        </div>

        {/* Amount */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-center">
          <p className="text-gray-500 text-sm mb-1">Amount</p>
          <p className="text-4xl font-bold text-gray-900">₦{amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-gray-400 mt-1">Nigerian Naira (NGN)</p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">From (Client)</p>
            <p className="font-semibold text-gray-900">{client?.name ?? "—"}</p>
            {client?.companyName && <p className="text-sm text-gray-600">{client.companyName}</p>}
            <p className="text-sm text-gray-500">{client?.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3">To (Freelancer)</p>
            <p className="font-semibold text-gray-900">{freelancer?.name ?? "—"}</p>
            <p className="text-sm text-gray-500">{freelancer?.email ?? "—"}</p>
          </div>
        </div>

        {/* Project info */}
        {project && (
          <div className="border-t border-gray-100 pt-5 mb-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Project</p>
            <p className="font-semibold text-gray-900">{project.title}</p>
            <p className="text-sm text-gray-500">{project.category}</p>
          </div>
        )}

        {/* Transaction info */}
        <div className="border-t border-gray-100 pt-5 space-y-2">
          {invoice.paystackReference && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment Reference</span>
              <span className="font-mono text-gray-700 text-xs">{invoice.paystackReference}</span>
            </div>
          )}
          {escrow?.fundedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Funded At</span>
              <span className="text-gray-700">{new Date(escrow.fundedAt).toLocaleString()}</span>
            </div>
          )}
          {escrow?.releasedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Released At</span>
              <span className="text-gray-700">{new Date(escrow.releasedAt).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Escrow Status</span>
            <span className="capitalize font-medium text-gray-700">{escrow?.status ?? "—"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 mt-6 pt-4 text-center text-xs text-gray-400">
          <p>This is an official receipt from SkillMarket AI. Keep this for your records.</p>
          <p className="mt-1">Invoice #{invoice.invoiceNumber} · Generated {new Date(invoice.createdAt).toISOString().slice(0, 10)}</p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4 print:hidden">You can print or save this page as PDF using your browser's print function.</p>
    </div>
  );
}
