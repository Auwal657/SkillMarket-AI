import { Link } from "wouter";
import { Briefcase, Users, DollarSign, FolderOpen, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { useGetClientDashboard } from "@workspace/api-client-react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, getStatusColor, formatRelativeTime, cn } from "../../lib/utils";

export default function ClientDashboard() {
  const { user } = useAuth();
  const { data: dashboard, isLoading } = useGetClientDashboard();

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const stats = [
    { icon: Briefcase, label: "Projects Posted", value: dashboard?.totalProjectsPosted ?? 0, color: "text-indigo-600 bg-indigo-50" },
    { icon: FolderOpen, label: "Open Projects", value: dashboard?.openProjects ?? 0, color: "text-green-600 bg-green-50" },
    { icon: Users, label: "Applications Received", value: dashboard?.totalApplicationsReceived ?? 0, color: "text-blue-600 bg-blue-50" },
    { icon: DollarSign, label: "Total Spent", value: formatCurrency(dashboard?.totalSpent ?? 0), color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.name?.split(" ")[0]}! Manage your projects.</p>
        </div>
        <Link href="/post-project" className="btn-primary"><Plus size={16} /> Post Project</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Recent Projects</h2>
            <Link href="/my-projects" className="text-sm text-indigo-600 flex items-center gap-1 hover:text-indigo-800">View all <ArrowRight size={14} /></Link>
          </div>
          {dashboard?.recentProjects && dashboard.recentProjects.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentProjects.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="min-w-0 flex-1">
                    <Link href={`/projects/${p.id}`} className="font-medium text-sm text-gray-900 hover:text-indigo-600 block truncate">{p.title}</Link>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{formatRelativeTime(p.createdAt)}</span>
                      <span className="text-xs text-gray-400">{p.applicationCount} applications</span>
                      <span className="text-xs text-gray-400">{formatCurrency(p.budgetMin)}–{formatCurrency(p.budgetMax)}</span>
                    </div>
                  </div>
                  <span className={cn("badge ml-3 flex-shrink-0", getStatusColor(p.status))}>{p.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Briefcase className="mx-auto mb-3 opacity-30" size={32} />
              <p className="text-sm">No projects yet. Post your first project!</p>
              <Link href="/post-project" className="mt-3 btn-primary text-sm inline-flex"><Plus size={14} /> Post Project</Link>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/post-project" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <Plus size={16} className="text-indigo-500" /> Post New Project
              </Link>
              <Link href="/my-projects" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <FolderOpen size={16} className="text-indigo-500" /> My Projects
              </Link>
              <Link href="/freelancers" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <Users size={16} className="text-indigo-500" /> Browse Talent
              </Link>
              <Link href="/profile/edit" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <TrendingUp size={16} className="text-indigo-500" /> Edit Profile
              </Link>
            </div>
          </div>
          <div className="card p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
            <h3 className="font-semibold text-indigo-900 mb-2">💡 Pro Tip</h3>
            <p className="text-sm text-indigo-700 leading-relaxed">Add specific required skills to your projects to get better AI-matched applications from the right freelancers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
