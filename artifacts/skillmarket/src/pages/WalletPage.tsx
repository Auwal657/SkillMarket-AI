import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle,
  FileText, RefreshCw, TrendingUp, Send, Landmark, Receipt, CreditCard
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
  pending: { icon: Clock, color: "text-amber-600 bg-amber-100 border-amber-200", label: "Pending Processing" },
  approved: { icon: CheckCircle, color: "text-blue-600 bg-blue-100 border-blue-200", label: "Approved (Sending)" },
  rejected: { icon: XCircle, color: "text-red-600 bg-red-100 border-red-200", label: "Rejected" },
  completed: { icon: CheckCircle, color: "text-green-600 bg-green-100 border-green-200", label: "Completed" },
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

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;

  const balance = parseFloat(wallet?.balance ?? "0");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
              <Wallet size={24} className="text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Wallet</h1>
          </div>
          <p className="text-gray-500 md:ml-15">Manage your earnings, request withdrawals, and view financial history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Balance & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance card */}
          <div className="relative overflow-hidden bg-gray-900 rounded-3xl p-8 text-white shadow-xl shadow-gray-900/20">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-40 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full mix-blend-screen filter blur-[60px] opacity-30 -ml-10 -mb-10"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-400 font-medium uppercase tracking-wider text-xs">Available Balance</p>
                <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-mono tracking-widest uppercase">ID: {wallet?.id.toString().padStart(6, '0')}</span>
              </div>
              
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-3xl font-light text-gray-300">₦</span>
                <p className="text-5xl font-bold tracking-tight">{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</p>
              </div>
              
              <div className="flex gap-3">
                {user?.role === "freelancer" ? (
                  <button 
                    onClick={() => setShowWithdrawForm(!showWithdrawForm)} 
                    className="flex-1 inline-flex justify-center items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-indigo-500/30"
                  >
                    <ArrowUpRight size={18} /> Withdraw
                  </button>
                ) : (
                  <div className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-gray-300">
                    <CreditCard size={16} /> Auto-funded via Escrow
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="card p-2 shadow-sm border border-gray-100 hidden lg:block">
            <nav className="flex flex-col space-y-1">
              {[
                { id: "overview", label: "Overview", icon: TrendingUp },
                { id: "transactions", label: "Transactions", icon: RefreshCw },
                { id: "withdrawals", label: "Withdrawals", icon: Landmark },
                { id: "invoices", label: "Invoices & Receipts", icon: Receipt }
              ].map(item => {
                const Icon = item.icon;
                const isActive = tab === item.id;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => { setTab(item.id as typeof tab); setShowWithdrawForm(false); }} 
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all", 
                      isActive 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <Icon size={18} className={isActive ? "text-indigo-600" : "text-gray-400"} />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
          
          {/* Mobile Tab Select */}
          <div className="lg:hidden w-full">
            <select 
              value={tab} 
              onChange={(e) => { setTab(e.target.value as typeof tab); setShowWithdrawForm(false); }}
              className="input w-full bg-white text-base py-3 shadow-sm font-medium"
            >
              <option value="overview">Overview</option>
              <option value="transactions">Transactions</option>
              <option value="withdrawals">Withdrawal Requests</option>
              <option value="invoices">Invoices & Receipts</option>
            </select>
          </div>
        </div>

        {/* Right Column: Content Area */}
        <div className="lg:col-span-2">
          
          {withdrawSuccess && (
            <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-2xl text-green-800 flex items-center gap-3 shadow-sm animate-in">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle size={18} className="text-green-600" />
              </div>
              <p className="font-medium">{withdrawSuccess}</p>
            </div>
          )}

          {/* Withdraw form */}
          {showWithdrawForm && (
            <div className="card p-8 mb-8 border-2 border-indigo-100 shadow-md animate-slide-up">
              <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Landmark size={20} className="text-indigo-600" /> Request Withdrawal
                </h2>
                <button onClick={() => setShowWithdrawForm(false)} className="text-gray-400 hover:text-gray-900 p-2"><XCircle size={20}/></button>
              </div>
              
              {withdrawError && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">{withdrawError}</div>}
              
              <form onSubmit={handleWithdraw} className="space-y-5">
                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 mb-6 text-center">
                  <label className="block text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Amount to Withdraw (₦)</label>
                  <input 
                    type="number" min="1" max={balance} step="0.01" 
                    className="w-full text-center text-4xl font-bold bg-transparent border-b-2 border-indigo-200 focus:border-indigo-600 focus:outline-none focus:ring-0 pb-2 transition-colors" 
                    placeholder="0.00" 
                    value={withdrawForm.amount} 
                    onChange={e => setWithdrawForm(f => ({ ...f, amount: e.target.value }))} 
                    required 
                  />
                  <button type="button" onClick={() => setWithdrawForm(f => ({...f, amount: balance.toString()}))} className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 uppercase tracking-wide bg-indigo-100/50 px-3 py-1 rounded-full">
                    Withdraw Max: ₦{balance.toLocaleString()}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="label">Bank Name</label>
                    <input type="text" className="input bg-gray-50/50 focus:bg-white" placeholder="e.g. Guarantee Trust Bank (GTB)" value={withdrawForm.bankName} onChange={e => setWithdrawForm(f => ({ ...f, bankName: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Account Number</label>
                    <input type="text" className="input bg-gray-50/50 focus:bg-white font-mono" placeholder="10-digit number" value={withdrawForm.accountNumber} onChange={e => setWithdrawForm(f => ({ ...f, accountNumber: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="label">Account Name</label>
                    <input type="text" className="input bg-gray-50/50 focus:bg-white" placeholder="Exact name on account" value={withdrawForm.accountName} onChange={e => setWithdrawForm(f => ({ ...f, accountName: e.target.value }))} required />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Additional Notes <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
                    <input type="text" className="input bg-gray-50/50 focus:bg-white" placeholder="Any specific instructions..." value={withdrawForm.note} onChange={e => setWithdrawForm(f => ({ ...f, note: e.target.value }))} />
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={withdrawing || balance <= 0} className="btn-primary w-full py-4 text-lg shadow-lg shadow-indigo-200">
                    {withdrawing ? (
                      <span className="flex items-center justify-center gap-2"><span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> Processing...</span>
                    ) : "Submit Withdrawal Request"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Active Tab Content */}
          {!showWithdrawForm && (
            <div className="card shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
              
              {/* Overview */}
              {tab === "overview" && (
                <div>
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
                    <button onClick={() => setTab("transactions")} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">View All</button>
                  </div>
                  
                  {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp size={32} className="text-gray-300" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-1">No transaction history</p>
                      <p className="text-gray-500 max-w-sm">When you receive payments or make withdrawals, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {transactions.slice(0, 8).map(tx => <TxRow key={tx.id} tx={tx} />)}
                    </div>
                  )}
                </div>
              )}

              {/* Transactions */}
              {tab === "transactions" && (
                <div>
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-xl font-bold text-gray-900">All Transactions</h2>
                    <button onClick={loadTransactions} className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg shadow-sm transition-colors"><RefreshCw size={16} /></button>
                  </div>
                  
                  {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <RefreshCw size={32} className="text-gray-300" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">No transactions</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {transactions.map(tx => <TxRow key={tx.id} tx={tx} />)}
                    </div>
                  )}
                </div>
              )}

              {/* Withdrawals */}
              {tab === "withdrawals" && (
                <div>
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-xl font-bold text-gray-900">Withdrawal Requests</h2>
                    <button onClick={loadWithdrawals} className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg shadow-sm transition-colors"><RefreshCw size={16} /></button>
                  </div>
                  
                  {withdrawals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Landmark size={32} className="text-gray-300" />
                      </div>
                      <p className="text-lg font-bold text-gray-900 mb-1">No withdrawals</p>
                      <p className="text-gray-500 text-sm">You haven't requested any payouts yet.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {withdrawals.map(wr => {
                        const s = statusConfig[wr.status];
                        const Icon = s.icon;
                        return (
                          <div key={wr.id} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                              <div>
                                <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border mb-2", s.color)}>
                                  <Icon size={12} /> {s.label}
                                </span>
                                <h3 className="text-2xl font-bold text-gray-900">₦{parseFloat(wr.amount).toLocaleString()}</h3>
                                <p className="text-xs text-gray-400 mt-1">Requested: {new Date(wr.createdAt).toLocaleDateString()} at {new Date(wr.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                              <div className="bg-gray-100/80 border border-gray-200 rounded-xl p-3 sm:text-right min-w-[200px]">
                                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Destination Bank</p>
                                <p className="font-bold text-gray-900 text-sm">{wr.bankName}</p>
                                <p className="text-gray-600 text-xs font-mono mt-0.5">{wr.accountNumber}</p>
                                <p className="text-gray-500 text-xs mt-0.5">{wr.accountName}</p>
                              </div>
                            </div>
                            
                            {wr.adminNote && (
                              <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-xl">
                                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">Note from Admin</p>
                                <p className="text-sm text-blue-900">{wr.adminNote}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Invoices */}
              {tab === "invoices" && (
                <div>
                  <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-xl font-bold text-gray-900">Invoices & Receipts</h2>
                    <button onClick={loadInvoices} className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg shadow-sm transition-colors"><RefreshCw size={16} /></button>
                  </div>
                  
                  {invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Receipt size={32} className="text-gray-300" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">No invoices available</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {invoices.map(inv => (
                        <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between p-5 hover:bg-indigo-50/50 transition-colors group cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm group-hover:border-indigo-300 group-hover:text-indigo-600 transition-colors">
                              <Receipt size={20} className="text-gray-500 group-hover:text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-bold text-base text-gray-900 group-hover:text-indigo-700 transition-colors">{inv.invoiceNumber}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded capitalize">{inv.type.replace(/_/g, " ")}</span>
                                <span className="text-xs text-gray-400 max-w-[200px] truncate hidden sm:inline-block">• {inv.projectTitle ?? "General"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-base text-gray-900">₦{parseFloat(inv.amount).toLocaleString()}</p>
                            <p className="text-[11px] font-medium text-gray-400 mt-1 uppercase tracking-wider">{new Date(inv.createdAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TxRow({ tx }: { tx: WalletTx }) {
  const isCredit = tx.type === "credit";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50 transition-colors gap-4">
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border", 
          isCredit ? "bg-green-50 border-green-100 text-green-600" : "bg-red-50 border-red-100 text-red-600"
        )}>
          {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
        </div>
        <div>
          <p className="font-bold text-gray-900 mb-0.5">{categoryLabels[tx.category] ?? tx.category}</p>
          <p className="text-sm text-gray-500 line-clamp-1">{tx.description}</p>
          <p className="text-[11px] font-medium text-gray-400 mt-1 sm:hidden">
            {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
      </div>
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-16 sm:pl-0 border-t sm:border-0 border-gray-100 pt-3 sm:pt-0">
        <p className={cn("font-bold text-lg", isCredit ? "text-green-600" : "text-gray-900")}>
          {isCredit ? "+" : "−"}₦{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </p>
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-1 hidden sm:block">
          {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})} • {new Date(tx.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </p>
      </div>
    </div>
  );
}
