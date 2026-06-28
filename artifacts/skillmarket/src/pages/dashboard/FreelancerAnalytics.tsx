import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  DollarSign, Briefcase, CheckCircle, Clock, Send,
  ThumbsUp, Eye, Star, TrendingUp, ArrowLeft, RefreshCw, Percent,
} from "lucide-react";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import MiniChart from "../../components/common/MiniChart";
import { formatCurrency } from "../../lib/utils";

interface FreelancerAnalyticsData {
  totalEarnings: number;
  completedProjects: number;
  averageRating: number | null;
  totalReviews: number;
  profileViews: number;
  hourlyRate: number;
  availabilityStatus: string;
  totalApplications: number;
  acceptedJobs: number;
  pendingApplications: number;
  acceptanceRate: number;
  activeProjects: number;
  monthlyEarnings: { month: string; value: number }[];
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

export default function FreelancerAnalytics() {
  const [data, setData] = useState<FreelancerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/freelancer", { credentials: "include" });
      if (!res.ok) { setError("Failed to load analytics"); return; }
      setData(await res.json());
    } catch { setError("Network error"); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-red-600">{error}</div>;
  if (!data) return null;

  const totalEarningsChart = data.monthlyEarnings.reduce((s, m) => s + m.value, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <TrendingUp size={20} className="text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
          </div>
          <p className="text-gray-500 text-sm pl-10">Your career performance at a glance</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 btn-secondary text-sm py-2 px-4">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={DollarSign} label="Total Earnings" value={formatCurrency(data.totalEarnings)} color="text-green-600 bg-green-50" />
        <StatCard icon={CheckCircle} label="Completed Projects" value={data.completedProjects} color="text-indigo-600 bg-indigo-50" />
        <StatCard icon={Briefcase} label="Active Projects" value={data.activeProjects} color="text-blue-600 bg-blue-50" />
        <StatCard icon={Clock} label="Pending Applications" value={data.pendingApplications} color="text-amber-600 bg-amber-50" />
        <StatCard icon={Send} label="Applications Sent" value={data.totalApplications} color="text-purple-600 bg-purple-50" />
        <StatCard icon={ThumbsUp} label="Accepted Jobs" value={data.acceptedJobs} color="text-emerald-600 bg-emerald-50" />
        <StatCard
          icon={Percent}
          label="Acceptance Rate"
          value={`${data.acceptanceRate}%`}
          sub={`${data.acceptedJobs} of ${data.totalApplications} apps`}
          color="text-cyan-600 bg-cyan-50"
        />
        <StatCard icon={Eye} label="Profile Views" value={data.profileViews.toLocaleString()} color="text-rose-600 bg-rose-50" />
      </div>

      {/* Charts + rating row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly earnings chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900">Monthly Earnings</h2>
            <span className="text-xs text-gray-400">Last 6 months</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-4">{formatCurrency(totalEarningsChart)}</p>
          <MiniChart
            data={data.monthlyEarnings}
            type="area"
            color="#6366f1"
            valuePrefix="₦"
            height={180}
          />
        </div>

        {/* Rating & reviews */}
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <Star className="mx-auto mb-2 fill-amber-400 text-amber-400" size={28} />
            <p className="text-4xl font-bold text-gray-900">{data.averageRating ? data.averageRating.toFixed(1) : "—"}</p>
            <p className="text-sm text-gray-500 mt-1">Average Rating</p>
            <p className="text-xs text-gray-400 mt-0.5">{data.totalReviews} review{data.totalReviews !== 1 ? "s" : ""}</p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Profile Summary</h3>
            <div className="space-y-3">
              {[
                { label: "Hourly Rate", value: formatCurrency(data.hourlyRate) + "/hr" },
                { label: "Availability", value: data.availabilityStatus === "available" ? "✅ Available" : data.availabilityStatus === "busy" ? "🟡 Busy" : "🔴 Unavailable" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Application funnel */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Application Funnel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Sent", value: data.totalApplications, pct: 100, color: "bg-purple-500" },
            { label: "Accepted", value: data.acceptedJobs, pct: data.totalApplications > 0 ? Math.round(data.acceptedJobs / data.totalApplications * 100) : 0, color: "bg-green-500" },
            { label: "Pending", value: data.pendingApplications, pct: data.totalApplications > 0 ? Math.round(data.pendingApplications / data.totalApplications * 100) : 0, color: "bg-amber-500" },
          ].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 font-medium">{item.label}</span>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{item.pct}% of applications</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
