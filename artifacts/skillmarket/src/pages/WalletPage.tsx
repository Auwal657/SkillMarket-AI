import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle,
  AlertCircle, FileText, RefreshCw, TrendingUp, Send,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, cn } from "../lib/utils";

interface WalletData {
  id: number;
  balance: string;
  currency: string;
}

interface WalletTx {
  id: number;
  type: "credit" | "debit";
  category: string;
  amount: string;
  description: string;
  reference: string;
  balanceBefore: string;
  balanceAfter: string;
  escrowTransactionId: number | null;
  projectTitle?: string | null;
  createdAt: string;
}

interface WithdrawalRequest {
  id: number;
  amount: string;
  status: "pending" | "approved" | "rejected" | "completed";
  bankName: string;
  accountNumber: string;
  accountName: string;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: string;
  type: string;
  projectTitle?: string | null;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  escrow_fund: "Escrow Funded",
  escrow_release: "Payment Received",
  refund: "Refund",
  withdrawal: "Withdrawal",
  fee: "Platform Fee",
  deposit: "Deposit",
};

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Pending" },
  approved: { icon: CheckCircle, color: "text-blue-600 bg-blue-50", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Rejected" },
  completed: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Completed" },
};

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "transactions" | "withdrawals" | "invoices">("overview");
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", bankName: "", accountNumber: "", accountName: "", note: "" });

  const loadWallet = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wallet", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setWallet(data.wallet);
        setTransactions(data.recentTransactions ?? []);
      }
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const loadTransactions = async () => {
    const res = await fetch("/api/wallet/transactions", { credentials: "include" });
    if (res.ok) { const d = await res.json(); setTransactions(d.transactions ?? []); }
  };

  const loadWithdrawals = async () => {
    const res = await fetch("/api/wallet/withdrawals", { credentials: "include" });
    if (res.ok) setWithdrawals(await res.json());
  };

  const loadInvoices = async () => {
    const res = await fetch("/api/wallet/invoices", { credentials: "include" });
    if (res.ok) setInvoices(await res.json());
  };

  useEffect(() => { loadWallet(); }, []);

  useEffect(() => {
    if (tab === "transactions") loadTransactions();
    if (tab === "withdrawals") loadWithdrawals();
    if (tab === "invoices") loadInvoices();
  }, [tab]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(""); setWithdrawSuccess("");
    const amount = parseFloat(withdrawForm.amount);
    if (isNaN(amount) || amount <= 0) { setWithdrawError("Enter a valid amount"); return; }
    if (!withdrawForm.bankName || !withdrawForm.accountNumber || !withdrawForm.accountName) {
      setWithdrawError("All bank details are required"); return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...withdrawForm, amount }),
      });
      const data = await res.json();
      if (!res.ok) { setWithdrawError(data.error ?? "Request failed"); return; }
      setWithdrawSuccess("Withdrawal request submitted. You will be notified once processed.");
      setShowWithdrawForm(false);
      setWithdrawForm({ amount: "", bankName: "", accountNumber: "", accountName: "", note: "" });
      loadWallet();
      loadWithdrawals();
    } catch { setWithdrawError("Network error. Please try again."); } finally { setWithdrawing(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const balance = parseFloat(wallet?.balance ?? "0");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="text-indigo-600" size={26} /> My Wallet
          </h1>
          <p className="text-gray-500 mt-1">Manage your balance, payments, and withdrawals.</p>
        </div>
        {user?.role === "freelancer" && (
          <button onClick={() => setShowWithdrawForm(true)} className="btn-primary text-sm py-2 px-4">
            <Send size={15} /> Withdraw
          </button>
        )}
      </div>

      {/* Balance card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white shadow-lg">
        <p className="text-indigo-200 text-sm mb-1">Available Balance</p>
        <p className="text-4xl font-bold mb-1">₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
        <p className="text-indigo-200 text-xs">{wallet?.currency ?? "NGN"} · Wallet #{wallet?.id}</p>
        {user?.role === "freelancer" && balance > 0 && (
          <button onClick={() => setShowWithdrawForm(true)} className="mt-4 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Send size={14} /> Request Withdrawal
          </button>
        )}
      </div>

      {/* Withdraw form */}
      {showWithdrawForm && (
        <div className="card p-6 mb-8 border-indigo-200 border-2">
          <h2 className="font-semibold text-gray-900 mb-4">Withdraw Funds</h2>
          {withdrawError && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{withdrawError}</div>}
          <form onSubmit={handleWithdraw} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Amount (₦)</label>
              <input type="number" min="1" max={balance} step="0.01" className="input" placeholder="Enter amount" value={withdrawForm.amount} onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} required />
              <p className="text-xs text-gray-400 mt-1">Available: ₦{balance.toLocaleString()}</p>
            </div>
            <div>
              <label className="label">Bank Name</label>
              <input type="text" className="input" placeholder="e.g. First Bank" value={withdrawForm.bankName} onChange={e => setWithdrawForm(f => ({ ...f, bankName: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Account Number</label>
              <input type="text" className="input" placeholder="10-digit account number" value={withdrawForm.accountNumber} onChange={e => setWithdrawForm(f => ({ ...f, accountNumber: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Account Name</label>
              <input type="text" className="input" placeholder="Name on account" value={withdrawForm.accountName} onChange={e => setWithdrawForm(f => ({ ...f, accountName: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <input type="text" className="input" placeholder="Any notes for admin" value={withdrawForm.note} onChange={e => setWithdrawForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={withdrawing} className="btn-primary">{withdrawing ? "Submitting…" : "Submit Request"}</button>
              <button type="button" onClick={() => { setShowWithdrawForm(false); setWithdrawError(""); }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}
      {withdrawSuccess && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2"><CheckCircle size={16} />{withdrawSuccess}</div>}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(["overview", "transactions", "withdrawals", "invoices"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize", tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900")}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
            <button onClick={() => setTab("transactions")} className="text-sm text-indigo-600 hover:text-indigo-800">View all</button>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Transactions will appear here once payment activity begins.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map(tx => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions */}
      {tab === "transactions" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">All Transactions</h2>
            <button onClick={loadTransactions} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><RefreshCw size={16} /></button>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
              <p>No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => <TxRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>
      )}

      {/* Withdrawals */}
      {tab === "withdrawals" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Withdrawal Requests</h2>
            <button onClick={loadWithdrawals} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><RefreshCw size={16} /></button>
          </div>
          {withdrawals.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Send size={40} className="mx-auto mb-3 opacity-30" />
              <p>No withdrawal requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map(wr => {
                const s = statusConfig[wr.status];
                const Icon = s.icon;
                return (
                  <div key={wr.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">₦{parseFloat(wr.amount).toLocaleString()}</span>
                        <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", s.color)}><Icon size={11} />{s.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{wr.bankName} · {wr.accountName} · {wr.accountNumber}</p>
                      {wr.adminNote && <p className="text-xs text-gray-500 mt-1 italic">Admin: {wr.adminNote}</p>}
                    </div>
                    <p className="text-xs text-gray-400 ml-4">{new Date(wr.createdAt).toLocaleDateString()}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Invoices */}
      {tab === "invoices" && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Invoices & Receipts</h2>
            <button onClick={loadInvoices} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"><RefreshCw size={16} /></button>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p>No invoices yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map(inv => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-xl transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <FileText size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 group-hover:text-indigo-700">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-500">{inv.projectTitle ?? "—"} · {inv.type.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-gray-900">₦{parseFloat(inv.amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TxRow({ tx }: { tx: WalletTx }) {
  const isCredit = tx.type === "credit";
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", isCredit ? "bg-green-100" : "bg-red-100")}>
          {isCredit ? <ArrowDownLeft size={16} className="text-green-600" /> : <ArrowUpRight size={16} className="text-red-600" />}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{categoryLabels[tx.category] ?? tx.category}</p>
          <p className="text-xs text-gray-500 truncate max-w-xs">{tx.description}</p>
        </div>
      </div>
      <div className="text-right ml-4">
        <p className={cn("font-semibold text-sm", isCredit ? "text-green-600" : "text-red-600")}>
          {isCredit ? "+" : "−"}₦{parseFloat(tx.amount).toLocaleString()}
        </p>
        <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
