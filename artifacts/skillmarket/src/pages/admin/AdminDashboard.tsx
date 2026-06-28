import { useState, useEffect } from "react";
import { Link } from "wouter";
import {
  Users, FolderOpen, FileText, Star, Trash2, Shield, ShieldOff,
  BarChart2, Clock, CheckCircle, XCircle, RefreshCw, Wallet,
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Avatar from "../../components/common/Avatar";
import { formatDate, getStatusColor, cn } from "../../lib/utils";

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalApplications: number;
  totalReviews: number;
  projectsByStatus: { status: string; count: number }[];
  usersByRole: { role: string; count: number }[];
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  university?: string | null;
  isAdmin: boolean;
  createdAt: string;
}

interface Project {
  id: number;
  title: string;
  status: string;
  category: string;
  clientId: number;
  budgetMin: string | null;
  budgetMax: string | null;
  createdAt: string;
}

interface EscrowTx {
  id: number;
  projectId: number;
  projectTitle: string | null;
  clientName: string | null;
  freelancerName: string | null;
  amount: string;
  status: string;
  createdAt: string;
  fundedAt: string | null;
  releasedAt: string | null;
}

interface AdminWithdrawal {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  amount: string;
  status: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  note: string | null;
  adminNote: string | null;
  createdAt: string;
  processedAt: string | null;
}

type Tab = "overview" | "users" | "projects" | "payments";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check admin access
  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => setIsAdmin(d.isAdmin ?? false))
      .catch(() => setIsAdmin(false));
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats", { credentials: "include" });
      if (!res.ok) { setError("Failed to load stats"); return; }
      setStats(await res.json());
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users?limit=100", { credentials: "include" });
      if (!res.ok) { setError("Failed to load users"); return; }
      setUsers(await res.json());
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/projects?limit=100", { credentials: "include" });
      if (!res.ok) { setError("Failed to load projects"); return; }
      setProjects(await res.json());
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      const [eRes, wRes] = await Promise.all([
        fetch("/api/admin/payments/escrow", { credentials: "include" }),
        fetch("/api/admin/payments/withdrawals", { credentials: "include" }),
      ]);
      if (eRes.ok) setEscrows(await eRes.json());
      if (wRes.ok) setWithdrawals(await wRes.json());
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  const processWithdrawal = async (id: number, status: "approved" | "rejected" | "completed", adminNote?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/payments/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, adminNote }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, ...updated } : w));
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to process withdrawal");
      }
    } finally { setActionLoading(null); }
  };

  useEffect(() => {
    if (isAdmin !== true) return;
    if (tab === "overview") loadStats();
    else if (tab === "users") loadUsers();
    else if (tab === "projects") loadProjects();
    else if (tab === "payments") loadPayments();
  }, [tab, isAdmin]);

  const toggleAdmin = async (user: User) => {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAdmin: !user.isAdmin }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: updated.isAdmin } : u));
      }
    } finally { setActionLoading(null); }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId));
    } finally { setActionLoading(null); }
  };

  const deleteProject = async (projectId: number) => {
    if (!confirm("Permanently delete this project?")) return;
    setActionLoading(projectId);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setProjects(prev => prev.filter(p => p.id !== projectId));
    } finally { setActionLoading(null); }
  };

  if (isAdmin === null) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  if (isAdmin === false) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6">You need admin privileges to view this page.</p>
        <Link href="/" className="btn-primary px-6 py-2">Go Home</Link>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: BarChart2 },
    { key: "users", label: "Users", icon: Users },
    { key: "projects", label: "Projects", icon: FolderOpen },
    { key: "payments", label: "Payments", icon: Wallet },
  ];

  const statusIcon: Record<string, React.ElementType> = {
    open: Clock,
    in_progress: RefreshCw,
    completed: CheckCircle,
    cancelled: XCircle,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-indigo-600" size={22} />
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500 text-sm">Platform management &amp; moderation</p>
        </div>
        <button onClick={() => {
          if (tab === "overview") loadStats();
          else if (tab === "users") loadUsers();
          else if (tab === "projects") loadProjects();
          else loadPayments();
        }} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setError(null); }}
            className={cn("flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all",
              tab === t.key ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-700")}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : tab === "overview" && stats ? (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600" },
              { label: "Total Projects", value: stats.totalProjects, icon: FolderOpen, color: "bg-indigo-50 text-indigo-600" },
              { label: "Applications", value: stats.totalApplications, icon: FileText, color: "bg-purple-50 text-purple-600" },
              { label: "Reviews", value: stats.totalReviews, icon: Star, color: "bg-amber-50 text-amber-600" },
            ].map(s => (
              <div key={s.label} className="card p-5 flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", s.color)}>
                  <s.icon size={22} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projects by status */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Projects by Status</h3>
              <div className="space-y-3">
                {stats.projectsByStatus.map(s => {
                  const Icon = statusIcon[s.status] ?? FileText;
                  const pct = stats.totalProjects > 0 ? Math.round((Number(s.count) / stats.totalProjects) * 100) : 0;
                  return (
                    <div key={s.status} className="flex items-center gap-3">
                      <Icon size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 w-24 capitalize">{s.status.replace("_", " ")}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8 text-right">{Number(s.count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Users by role */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Users by Role</h3>
              <div className="space-y-3">
                {stats.usersByRole.map(r => {
                  const pct = stats.totalUsers > 0 ? Math.round((Number(r.count) / stats.totalUsers) * 100) : 0;
                  return (
                    <div key={r.role} className="flex items-center gap-3">
                      <Users size={15} className="text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 w-24 capitalize">{r.role}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8 text-right">{Number(r.count)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : tab === "users" ? (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <p className="font-medium text-gray-700 text-sm">{users.length} users</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["User", "Role", "University", "Joined", "Admin", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={cn("badge", u.role === "client" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700")}>{u.role}</span></td>
                    <td className="px-4 py-3 text-gray-500">{u.university ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("badge text-xs", u.isAdmin ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500")}>
                        {u.isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => toggleAdmin(u)} disabled={actionLoading === u.id}
                          title={u.isAdmin ? "Remove admin" : "Make admin"}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50">
                          {u.isAdmin ? <ShieldOff size={15} /> : <Shield size={15} />}
                        </button>
                        <button onClick={() => deleteUser(u.id)} disabled={actionLoading === u.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "projects" ? (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="font-medium text-gray-700 text-sm">{projects.length} projects</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {["Project", "Status", "Category", "Budget", "Posted", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${p.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">{p.title}</Link>
                    </td>
                    <td className="px-4 py-3"><span className={cn("badge", getStatusColor(p.status))}>{p.status.replace("_", " ")}</span></td>
                    <td className="px-4 py-3 text-gray-500">{p.category}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {p.budgetMin && p.budgetMax ? `$${p.budgetMin}–$${p.budgetMax}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteProject(p.id)} disabled={actionLoading === p.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "payments" ? (
        <div className="space-y-8">
          {/* Escrow Transactions */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Escrow Transactions ({escrows.length})</h3>
            </div>
            {escrows.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No escrow transactions yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Project", "Client → Freelancer", "Amount", "Status", "Funded", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {escrows.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link href={`/projects/${e.projectId}`} className="font-medium text-indigo-600 hover:text-indigo-800 text-sm">
                            {e.projectTitle ?? `Project #${e.projectId}`}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {e.clientName ?? "—"} <span className="text-gray-400">→</span> {e.freelancerName ?? "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">₦{parseFloat(e.amount).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={cn("badge capitalize", {
                            in_escrow: "bg-indigo-100 text-indigo-700",
                            released: "bg-green-100 text-green-700",
                            pending: "bg-yellow-100 text-yellow-700",
                            refunded: "bg-orange-100 text-orange-700",
                            funded: "bg-blue-100 text-blue-700",
                            cancelled: "bg-gray-100 text-gray-600",
                          }[e.status] ?? "bg-gray-100 text-gray-600")}>
                            {e.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{e.fundedAt ? formatDate(e.fundedAt) : "—"}</td>
                        <td className="px-4 py-3">
                          {["funded", "in_escrow"].includes(e.status) && (
                            <button
                              onClick={async () => {
                                if (!confirm("Issue refund for this escrow?")) return;
                                setActionLoading(e.id);
                                try {
                                  await fetch(`/api/payments/refund/${e.projectId}`, { method: "POST", credentials: "include" });
                                  loadPayments();
                                } finally { setActionLoading(null); }
                              }}
                              disabled={actionLoading === e.id}
                              className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Withdrawal Requests */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Withdrawal Requests ({withdrawals.length})</h3>
            </div>
            {withdrawals.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No withdrawal requests yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Freelancer", "Amount", "Bank Details", "Status", "Note", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {withdrawals.map(w => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{w.userName ?? "—"}</p>
                          <p className="text-xs text-gray-400">{w.userEmail ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">₦{parseFloat(w.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          <p>{w.bankName}</p>
                          <p className="font-mono">{w.accountNumber}</p>
                          <p className="text-gray-400">{w.accountName}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("badge capitalize", {
                            pending: "bg-yellow-100 text-yellow-700",
                            approved: "bg-blue-100 text-blue-700",
                            completed: "bg-green-100 text-green-700",
                            rejected: "bg-red-100 text-red-700",
                          }[w.status] ?? "bg-gray-100 text-gray-600")}>
                            {w.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs">
                          {w.note ?? "—"}
                          {w.adminNote && <p className="text-indigo-600 mt-1 italic">Admin: {w.adminNote}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {w.status === "pending" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => processWithdrawal(w.id, "approved")}
                                disabled={actionLoading === w.id}
                                className="text-xs px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                              >Approve</button>
                              <button
                                onClick={() => processWithdrawal(w.id, "rejected", "Rejected by admin")}
                                disabled={actionLoading === w.id}
                                className="text-xs px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                              >Reject</button>
                            </div>
                          )}
                          {w.status === "approved" && (
                            <button
                              onClick={() => processWithdrawal(w.id, "completed")}
                              disabled={actionLoading === w.id}
                              className="text-xs px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                            >Mark Done</button>
                          )}
                          {(w.status === "completed" || w.status === "rejected") && (
                            <span className="text-xs text-gray-400">{w.processedAt ? formatDate(w.processedAt) : "Processed"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
