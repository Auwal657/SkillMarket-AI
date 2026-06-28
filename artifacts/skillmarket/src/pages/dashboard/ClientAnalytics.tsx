import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  DollarSign, Briefcase, CheckCircle, Users, TrendingUp,
  ArrowLeft, RefreshCw, Star, XCircle, FolderOpen,
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import MiniChart from "../../components/common/MiniChart";
import { formatCurrency } from "../../lib/utils";

interface ClientAnalyticsData {
  totalProjectsPosted: number;
  activeProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  totalSpending: number;
  freelancersHired: number;
  projectSuccessRate: number;
  avgFreelancerRating: number | null;
  monthlySpending: { month: string; value: number }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function ClientAnalytics() {
  const [data, setData] = useState<ClientAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/client", { credentials: "include" });
      if (!res.ok) { setError("Failed to load analytics"); return; }
      setData(await res.json());
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-red-600">{error}</div>;
  if (!data) return null;

  const totalSpendingChart = data.monthlySpending.reduce((s, m) => s + m.value, 0);

  const projectBreakdown = [
    { label: "Open", value: data.totalProjectsPosted - data.activeProjects - data.completedProjects - data.cancelledProjects, color: "bg-blue-500" },
    { label: "Active", value: data.activeProjects, color: "bg-indigo-500" },
    { label: "Completed", value: data.completedProjects, color: "bg-green-500" },
    { label: "Cancelled", value: data.cancelledProjects, color: "bg-gray-400" },
  ].filter(b => b.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/client" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <TrendingUp size={20} className="text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">Spending Analytics</h1>
          </div>
          <p className="text-gray-500 text-sm pl-10">Track your hiring performance and spend</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 btn-secondary text-sm py-2 px-4">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Total Spending" value={formatCurrency(data.totalSpending)} color="text-green-600 bg-green-50" />
        <StatCard icon={Briefcase} label="Projects Posted" value={data.totalProjectsPosted} color="text-indigo-600 bg-indigo-50" />
        <StatCard icon={FolderOpen} label="Active Projects" value={data.activeProjects} color="text-blue-600 bg-blue-50" />
        <StatCard icon={CheckCircle} label="Completed" value={data.completedProjects} color="text-emerald-600 bg-emerald-50" />
        <StatCard icon={XCircle} label="Cancelled" value={data.cancelledProjects} color="text-gray-600 bg-gray-50" />
        <StatCard icon={Users} label="Freelancers Hired" value={data.freelancersHired} color="text-purple-600 bg-purple-50" />
        <StatCard
          icon={CheckCircle}
          label="Success Rate"
          value={`${data.projectSuccessRate}%`}
          sub="Completed / non-cancelled"
          color="text-cyan-600 bg-cyan-50"
        />
        {data.avgFreelancerRating !== null && data.avgFreelancerRating > 0 ? (
          <StatCard icon={Star} label="Avg Freelancer Rating" value={`${data.avgFreelancerRating.toFixed(1)}★`} color="text-amber-600 bg-amber-50" />
        ) : (
          <StatCard icon={Star} label="Avg Freelancer Rating" value="—" sub="No reviews yet" color="text-amber-600 bg-amber-50" />
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly spending chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">Monthly Spending</h2>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-4">{formatCurrency(totalSpendingChart)}</p>
          <MiniChart
            data={data.monthlySpending}
            type="bar"
            color="#6366f1"
            valuePrefix="₦"
            height={180}
          />
        </div>

        {/* Project breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Project Breakdown</h2>
          {projectBreakdown.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">No projects yet</div>
          ) : (
            <div className="space-y-4">
              {projectBreakdown.map(item => {
                const pct = data.totalProjectsPosted > 0 ? Math.round((item.value / data.totalProjectsPosted) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{pct}%</p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-gray-50 mt-5 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Success Rate</span>
              <span className={`text-sm font-bold ${data.projectSuccessRate >= 70 ? "text-green-600" : data.projectSuccessRate >= 40 ? "text-amber-600" : "text-red-500"}`}>
                {data.projectSuccessRate}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${data.projectSuccessRate >= 70 ? "bg-green-500" : data.projectSuccessRate >= 40 ? "bg-amber-500" : "bg-red-400"}`}
                style={{ width: `${data.projectSuccessRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
