import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Users, FolderOpen, Wallet, TrendingUp, DollarSign, UserCheck,
  UserPlus, Activity, CheckCircle, RefreshCw, Trash2,
  Shield, ShieldOff, ShieldAlert, BarChart2, BadgeCheck, Clock,
  AlertTriangle, Eye, Ban, Search,
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Avatar from "../../components/common/Avatar";
import MiniChart from "../../components/common/MiniChart";
import { formatDate, formatCurrency, cn } from "../../lib/utils";

type Tab = "analytics" | "users" | "freelancers" | "projects" | "reports" | "payments";

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  university?: string | null;
  isAdmin: boolean;
  isSuspended: boolean;
  isBanned: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface FreelancerProfile {
  id: number;
  userId: number;
  headline: string;
  hourlyRate: number;
  averageRating: number | null;
  completedProjects: number;
  totalEarnings: number;
  isVerified: boolean;
  createdAt: string;
  user: { id: number; name: string; email: string; avatarUrl?: string | null } | null;
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

interface Report {
  id: number;
  reporterId: number;
  reporterName: string;
  targetType: "user" | "project" | "message";
  targetId: number;
  reason: string;
  description: string | null;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  adminNote: string | null;
  resolvedAt: string | null;
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
}

interface Withdrawal {
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
}

interface Analytics {
  totalUsers: number;
  totalFreelancers: number;
  totalClients: number;
  totalProjects: number;
  openProjects: number;
  activeProjects: number;
  completedProjects: number;
  platformRevenue: number;
  monthlyRegistrations: { month: string; value: number }[];
  monthlyRevenue: { month: string; value: number }[];
  recentUsers: { id: number; name: string; email: string; role: string; createdAt: string }[];
  topFreelancers: { id: number; userId: number; name: string; totalEarnings: number; completedProjects: number; averageRating: number | null }[];
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="card p-5">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewed: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
    dismissed: "bg-gray-100 text-gray-500",
    open: "bg-indigo-100 text-indigo-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    in_escrow: "bg-indigo-100 text-indigo-700",
    released: "bg-green-100 text-green-700",
    refunded: "bg-orange-100 text-orange-700",
    funded: "bg-blue-100 text-blue-700",
    approved: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    freelancer: "bg-green-100 text-green-700",
    client: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize", map[status] ?? "bg-gray-100 text-gray-600")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("analytics");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reportFilter, setReportFilter] = useState("pending");

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => setIsAdmin(d.isAdmin ?? false))
      .catch(() => setIsAdmin(false));
  }, []);

  const loadData = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === "analytics") {
        const res = await fetch("/api/analytics/admin", { credentials: "include" });
        if (res.ok) setAnalytics(await res.json());
        else setError("Failed to load analytics");
      } else if (t === "users") {
        const res = await fetch("/api/admin/users?limit=100", { credentials: "include" });
        if (res.ok) setUsers(await res.json());
        else setError("Failed to load users");
      } else if (t === "freelancers") {
        const res = await fetch("/api/admin/freelancers?limit=100", { credentials: "include" });
        if (res.ok) setFreelancers(await res.json());
        else setError("Failed to load freelancers");
      } else if (t === "projects") {
        const res = await fetch("/api/admin/projects?limit=100", { credentials: "include" });
        if (res.ok) setProjects(await res.json());
        else setError("Failed to load projects");
      } else if (t === "reports") {
        const res = await fetch("/api/admin/reports?limit=100", { credentials: "include" });
        if (res.ok) setReports(await res.json());
        else setError("Failed to load reports");
      } else if (t === "payments") {
        const [eRes, wRes] = await Promise.all([
          fetch("/api/admin/payments/escrow", { credentials: "include" }),
          fetch("/api/admin/payments/withdrawals", { credentials: "include" }),
        ]);
        if (eRes.ok) setEscrows(await eRes.json());
        if (wRes.ok) setWithdrawals(await wRes.json());
      }
    } catch { setError("Network error"); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isAdmin === true) loadData(tab);
  }, [tab, isAdmin, loadData]);

  const patchUser = async (id: number, updates: Partial<Pick<AdminUser, "isAdmin" | "isSuspended" | "isBanned">>) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to update user");
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

  const deleteProject = async (id: number) => {
    if (!confirm("Permanently delete this project?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) setProjects(prev => prev.filter(p => p.id !== id));
    } finally { setActionLoading(null); }
  };

  const verifyFreelancer = async (id: number, isVerified: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/freelancers/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isVerified }),
      });
      if (res.ok) {
        setFreelancers(prev => prev.map(f => f.id === id ? { ...f, isVerified } : f));
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to update freelancer");
      }
    } finally { setActionLoading(null); }
  };

  const patchReport = async (id: number, updates: { status?: string; adminNote?: string }) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setReports(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to update report");
      }
    } finally { setActionLoading(null); }
  };

  const processWithdrawal = async (id: number, status: "approved" | "rejected" | "completed") => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/payments/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
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

  if (isAdmin === null) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  if (!isAdmin) {
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
    { key: "analytics", label: "Analytics", icon: TrendingUp },
    { key: "users", label: "Users", icon: Users },
    { key: "freelancers", label: "Freelancers", icon: BadgeCheck },
    { key: "projects", label: "Projects", icon: FolderOpen },
    { key: "reports", label: "Reports", icon: ShieldAlert },
    { key: "payments", label: "Payments", icon: Wallet },
  ];

  const filteredUsers = search
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const filteredReports = reportFilter === "all" ? reports : reports.filter(r => r.status === reportFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          </div>
          <p className="text-gray-500 text-sm">Platform management &amp; moderation</p>
        </div>
        <button onClick={() => loadData(tab)} className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 text-lg leading-none">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(""); }}
            className={cn(
              "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
              tab === t.key ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <>
          {/* ── ANALYTICS ── */}
          {tab === "analytics" && (
            analytics ? (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  <StatCard icon={Users} label="Total Users" value={analytics.totalUsers} color="bg-blue-50 text-blue-600" />
                  <StatCard icon={UserCheck} label="Freelancers" value={analytics.totalFreelancers} color="bg-green-50 text-green-600" />
                  <StatCard icon={UserPlus} label="Clients" value={analytics.totalClients} color="bg-purple-50 text-purple-600" />
                  <StatCard icon={FolderOpen} label="Projects" value={analytics.totalProjects} color="bg-indigo-50 text-indigo-600" />
                  <StatCard icon={Activity} label="Active" value={analytics.activeProjects} color="bg-blue-50 text-blue-600" />
                  <StatCard icon={CheckCircle} label="Completed" value={analytics.completedProjects} color="bg-emerald-50 text-emerald-600" />
                  <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(analytics.platformRevenue)} color="bg-amber-50 text-amber-600" />
                  <StatCard icon={BarChart2} label="Open Projects" value={analytics.openProjects} color="bg-rose-50 text-rose-600" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Monthly Registrations</h3>
                    <p className="text-2xl font-bold text-gray-900 mb-4">
                      {analytics.monthlyRegistrations.reduce((s, m) => s + m.value, 0)} new users
                    </p>
                    <MiniChart data={analytics.monthlyRegistrations} type="bar" color="#6366f1" height={180} />
                  </div>
                  <div className="card p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">Monthly Revenue</h3>
                    <p className="text-2xl font-bold text-gray-900 mb-4">
                      {formatCurrency(analytics.monthlyRevenue.reduce((s, m) => s + m.value, 0))}
                    </p>
                    <MiniChart data={analytics.monthlyRevenue} type="area" color="#10b981" valuePrefix="₦" height={180} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="card p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Recent Registrations</h3>
                    <div className="space-y-3">
                      {analytics.recentUsers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No users yet</p>}
                      {analytics.recentUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                              u.role === "client" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700")}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <StatusBadge status={u.role} />
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(u.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Top Freelancers by Earnings</h3>
                    <div className="space-y-3">
                      {analytics.topFreelancers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No freelancers yet</p>}
                      {analytics.topFreelancers.map((f, i) => (
                        <div key={f.id} className="flex items-center gap-3">
                          <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                            i === 0 ? "bg-amber-100 text-amber-700" :
                            i === 1 ? "bg-gray-100 text-gray-600" :
                            "bg-orange-50 text-orange-600")}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                            <p className="text-xs text-gray-400">{f.completedProjects} projects · ★ {f.averageRating?.toFixed(1) ?? "—"}</p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(f.totalEarnings)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">No analytics data available yet.</div>
            )
          )}

          {/* ── USERS ── */}
          {tab === "users" && (
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                  <p className="font-medium text-gray-700 text-sm">{filteredUsers.length} users</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 ml-auto">
                    <span className="flex items-center gap-1"><Shield size={11} className="text-indigo-400" /> = Admin</span>
                    <span className="flex items-center gap-1"><Clock size={11} className="text-orange-400" /> = Suspend</span>
                    <span className="flex items-center gap-1"><Ban size={11} className="text-red-400" /> = Ban</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["User", "Role", "Status", "Joined", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found</td></tr>
                      )}
                      {filteredUsers.map(u => (
                        <tr key={u.id} className={cn("hover:bg-gray-50 transition-colors", u.isBanned && "opacity-60")}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 flex items-center gap-1">
                                  {u.name}
                                  {u.isAdmin && <Shield size={11} className="text-indigo-500" />}
                                </p>
                                <p className="text-xs text-gray-400">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={u.role} /></td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {u.isBanned
                                ? <span className="badge bg-red-100 text-red-700 text-xs">Banned</span>
                                : u.isSuspended
                                  ? <span className="badge bg-orange-100 text-orange-700 text-xs">Suspended</span>
                                  : <span className="badge bg-green-100 text-green-700 text-xs">Active</span>
                              }
                              {u.isAdmin && <span className="badge bg-indigo-100 text-indigo-700 text-xs">Admin</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(u.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => patchUser(u.id, { isAdmin: !u.isAdmin })}
                                disabled={actionLoading === u.id}
                                title={u.isAdmin ? "Remove admin" : "Make admin"}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                              >
                                {u.isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
                              </button>
                              <button
                                onClick={() => patchUser(u.id, { isSuspended: !u.isSuspended })}
                                disabled={actionLoading === u.id}
                                title={u.isSuspended ? "Unsuspend" : "Suspend"}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-50"
                              >
                                <Clock size={14} />
                              </button>
                              <button
                                onClick={() => patchUser(u.id, { isBanned: !u.isBanned })}
                                disabled={actionLoading === u.id}
                                title={u.isBanned ? "Unban" : "Ban"}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                {u.isBanned ? <UserCheck size={14} /> : <Ban size={14} />}
                              </button>
                              <button
                                onClick={() => deleteUser(u.id)}
                                disabled={actionLoading === u.id}
                                title="Delete user"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── FREELANCERS ── */}
          {tab === "freelancers" && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                <p className="font-medium text-gray-700 text-sm">{freelancers.length} freelancer profiles</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <BadgeCheck size={13} className="text-indigo-500" />
                  Verified badge appears on freelancer profiles
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Freelancer", "Headline", "Rate", "Rating", "Projects", "Earnings", "Status", "Action"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {freelancers.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No freelancer profiles yet</td></tr>
                    )}
                    {freelancers.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={f.user?.name ?? "?"} avatarUrl={f.user?.avatarUrl} size="sm" />
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{f.user?.name ?? "—"}</p>
                              <p className="text-xs text-gray-400">{f.user?.email ?? "—"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs max-w-[140px]">
                          <p className="truncate">{f.headline}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">₦{f.hourlyRate.toLocaleString()}/hr</td>
                        <td className="px-4 py-3 text-gray-700 text-xs">
                          {f.averageRating != null ? `★ ${f.averageRating.toFixed(1)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">{f.completedProjects}</td>
                        <td className="px-4 py-3 text-gray-700 text-xs">{formatCurrency(f.totalEarnings)}</td>
                        <td className="px-4 py-3">
                          {f.isVerified
                            ? <span className="flex items-center gap-1 text-green-700 text-xs font-semibold"><BadgeCheck size={13} /> Verified</span>
                            : <span className="text-gray-400 text-xs">Unverified</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => verifyFreelancer(f.id, !f.isVerified)}
                            disabled={actionLoading === f.id}
                            className={cn(
                              "text-xs px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-50 font-medium",
                              f.isVerified
                                ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                                : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                            )}
                          >
                            {actionLoading === f.id ? "…" : f.isVerified ? "Unverify" : "Verify"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── PROJECTS ── */}
          {tab === "projects" && (
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
                    {projects.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No projects yet</td></tr>
                    )}
                    {projects.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/projects/${p.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 max-w-[200px] block">
                            {p.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{p.category}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {p.budgetMin && p.budgetMax
                            ? `₦${parseFloat(p.budgetMin).toLocaleString()}–₦${parseFloat(p.budgetMax).toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <Link href={`/projects/${p.id}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                              <Eye size={14} />
                            </Link>
                            <button onClick={() => deleteProject(p.id)} disabled={actionLoading === p.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── REPORTS ── */}
          {tab === "reports" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {["all", "pending", "reviewed", "resolved", "dismissed"].map(f => (
                  <button
                    key={f}
                    onClick={() => setReportFilter(f)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize",
                      reportFilter === f
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {f}
                    {f !== "all" && (
                      <span className="ml-1.5 text-xs opacity-70">
                        ({reports.filter(r => r.status === f).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {filteredReports.length === 0 ? (
                <div className="card p-12 text-center">
                  <ShieldAlert size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    {reportFilter === "all" ? "No reports yet" : `No ${reportFilter} reports`}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">All clear in this category.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map(r => (
                    <div key={r.id} className="card p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <StatusBadge status={r.status} />
                            <span className={cn("badge text-xs capitalize",
                              r.targetType === "user" ? "bg-blue-100 text-blue-700" :
                              r.targetType === "project" ? "bg-purple-100 text-purple-700" :
                              "bg-gray-100 text-gray-600")}>
                              {r.targetType} #{r.targetId}
                            </span>
                            <span className="badge bg-gray-100 text-gray-600 text-xs capitalize">
                              {r.reason.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Reported by <span className="font-medium">{r.reporterName}</span>
                            <span className="text-gray-400 ml-2 text-xs">{formatDate(r.createdAt)}</span>
                          </p>
                          {r.description && (
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-2">{r.description}</p>
                          )}
                          {r.adminNote && (
                            <p className="text-sm text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 mt-2">
                              <span className="font-medium">Admin note:</span> {r.adminNote}
                            </p>
                          )}
                          {r.targetType === "project" && (
                            <Link href={`/projects/${r.targetId}`}
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2">
                              <Eye size={12} /> View project
                            </Link>
                          )}
                        </div>
                        {(r.status === "pending" || r.status === "reviewed") && (
                          <div className="flex flex-wrap gap-2 flex-shrink-0">
                            {r.status === "pending" && (
                              <button
                                onClick={() => patchReport(r.id, { status: "reviewed" })}
                                disabled={actionLoading === r.id}
                                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Review
                              </button>
                            )}
                            <button
                              onClick={() => patchReport(r.id, { status: "resolved" })}
                              disabled={actionLoading === r.id}
                              className="text-xs px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => patchReport(r.id, { status: "dismissed" })}
                              disabled={actionLoading === r.id}
                              className="text-xs px-3 py-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Dismiss
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {tab === "payments" && (
            <div className="space-y-8">
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Escrow Transactions ({escrows.length})</h3>
                </div>
                {escrows.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No escrow transactions yet.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {["Project", "Client → Freelancer", "Amount", "Status", "Funded"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {escrows.map(e => (
                          <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/projects/${e.projectId}`} className="font-medium text-indigo-600 hover:text-indigo-800 text-sm">
                                {e.projectTitle ?? `Project #${e.projectId}`}
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {e.clientName ?? "—"} <span className="text-gray-300">→</span> {e.freelancerName ?? "—"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">₦{parseFloat(e.amount).toLocaleString()}</td>
                            <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{e.fundedAt ? formatDate(e.fundedAt) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

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
                          {["Freelancer", "Amount", "Bank Details", "Status", "Actions"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {withdrawals.map(w => (
                          <tr key={w.id} className="hover:bg-gray-50 transition-colors">
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
                            <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                            <td className="px-4 py-3">
                              {w.status === "pending" && (
                                <div className="flex gap-1">
                                  <button onClick={() => processWithdrawal(w.id, "approved")} disabled={actionLoading === w.id}
                                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg disabled:opacity-50">
                                    Approve
                                  </button>
                                  <button onClick={() => processWithdrawal(w.id, "rejected")} disabled={actionLoading === w.id}
                                    className="text-xs px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-lg disabled:opacity-50">
                                    Reject
                                  </button>
                                </div>
                              )}
                              {w.status === "approved" && (
                                <button onClick={() => processWithdrawal(w.id, "completed")} disabled={actionLoading === w.id}
                                  className="text-xs px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded-lg disabled:opacity-50">
                                  Mark Done
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
