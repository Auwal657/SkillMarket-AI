import { Link } from "wouter";
import { Briefcase, Users, DollarSign, FolderOpen, Plus, ArrowRight, TrendingUp, Zap, RefreshCw, Star, CheckCircle } from "lucide-react";
import { useGetClientDashboard, useGetAiFreelancerRecommendations, getGetAiFreelancerRecommendationsQueryKey } from "@workspace/api-client-react";
import type { ProjectFreelancerRecommendations, FreelancerRecommendation } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, getStatusColor, formatRelativeTime, cn } from "../../lib/utils";

function AvailabilityDot({ status }: { status: string }) {
  const color = status === "available" ? "bg-green-500" : status === "busy" ? "bg-amber-500" : "bg-gray-400";
  const label = status === "available" ? "Available" : status === "busy" ? "Busy" : "Unavailable";
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <span className={`w-1.5 h-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function FreelancerRecCard({ rec }: { rec: FreelancerRecommendation }) {
  const { freelancer, matchScore, matchReasons } = rec;
  const scoreColor =
    matchScore >= 80 ? "text-green-700 bg-green-50 border-green-200" :
    matchScore >= 60 ? "text-indigo-700 bg-indigo-50 border-indigo-200" :
    "text-amber-700 bg-amber-50 border-amber-200";

  return (
    <Link href={`/freelancers/${freelancer.userId}`} className="block card p-4 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          {freelancer.user?.avatarUrl ? (
            <img src={freelancer.user.avatarUrl} alt={freelancer.user.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-700 font-bold text-sm">
                {(freelancer.user?.name ?? "?").charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-600 transition-colors">
              {freelancer.user?.name ?? "Freelancer"}
            </p>
            <p className="text-xs text-gray-500 truncate">{freelancer.headline}</p>
          </div>
        </div>
        <span className={`flex-shrink-0 ml-2 text-xs font-bold px-2 py-1 rounded-full border ${scoreColor}`}>
          {matchScore}%
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
        <AvailabilityDot status={freelancer.availabilityStatus} />
        {freelancer.averageRating && (
          <span className="flex items-center gap-0.5">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {freelancer.averageRating.toFixed(1)}
          </span>
        )}
        {freelancer.completedProjects > 0 && (
          <span className="flex items-center gap-0.5">
            <CheckCircle size={11} className="text-green-500" />
            {freelancer.completedProjects} done
          </span>
        )}
        <span className="font-medium text-gray-700">₦{freelancer.hourlyRate}/hr</span>
      </div>

      {freelancer.skills && freelancer.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {freelancer.skills.slice(0, 4).map((s, i) => (
            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
              {s.skillName}
            </span>
          ))}
          {(freelancer.skills.length ?? 0) > 4 && (
            <span className="text-xs text-gray-400">+{freelancer.skills.length - 4}</span>
          )}
        </div>
      )}

      {matchReasons.length > 0 && (
        <div className="border-t border-gray-50 pt-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Why matched</p>
          <div className="flex flex-wrap gap-1">
            {matchReasons.slice(0, 3).map((r, i) => (
              <span key={i} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
}

function ProjectRecommendationBlock({ block }: { block: ProjectFreelancerRecommendations }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase size={14} className="text-indigo-500 flex-shrink-0" />
        <Link href={`/projects/${block.project.id}`} className="font-medium text-sm text-gray-900 hover:text-indigo-600 truncate">
          {block.project.title}
        </Link>
        <span className="flex-shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {block.project.category}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {block.recommendations.map((rec, i) => (
          <FreelancerRecCard key={`${rec.freelancer.id}-${i}`} rec={rec} />
        ))}
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading } = useGetClientDashboard();
  const {
    data: aiFreelancers,
    isFetching: aiFetching,
    refetch: refetchAi,
  } = useGetAiFreelancerRecommendations();

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const stats = [
    { icon: Briefcase, label: "Projects Posted", value: dashboard?.totalProjectsPosted ?? 0, color: "text-indigo-600 bg-indigo-50" },
    { icon: FolderOpen, label: "Open Projects", value: dashboard?.openProjects ?? 0, color: "text-green-600 bg-green-50" },
    { icon: Users, label: "Applications Received", value: dashboard?.totalApplicationsReceived ?? 0, color: "text-blue-600 bg-blue-50" },
    { icon: DollarSign, label: "Total Spent", value: formatCurrency(dashboard?.totalSpent ?? 0), color: "text-purple-600 bg-purple-50" },
  ];

  const handleRefreshAi = () => {
    queryClient.invalidateQueries({ queryKey: getGetAiFreelancerRecommendationsQueryKey() });
    refetchAi();
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
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

      {/* AI Freelancer Recommendations */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">AI-Recommended Talent</h2>
            <span className="badge bg-indigo-100 text-indigo-700">For your open projects</span>
          </div>
          <button
            onClick={handleRefreshAi}
            disabled={aiFetching}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={aiFetching ? "animate-spin" : ""} />
            {aiFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {aiFetching && !aiFreelancers && (
          <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>
        )}

        {!aiFetching && (!aiFreelancers || aiFreelancers.length === 0) && (
          <div className="text-center py-10 text-gray-400">
            <Users className="mx-auto mb-3 opacity-30" size={36} />
            <p className="font-medium text-gray-600 mb-1">No recommendations yet</p>
            <p className="text-sm mb-4">
              {(dashboard?.openProjects ?? 0) === 0
                ? "Post an open project with required skills to get AI-matched freelancer recommendations."
                : "Make sure your open projects have required skills specified for best results."}
            </p>
            <Link href="/post-project" className="btn-primary text-sm inline-flex"><Plus size={14} /> Post a Project</Link>
          </div>
        )}

        {aiFreelancers && aiFreelancers.length > 0 && (
          <div className="divide-y divide-gray-50">
            {aiFreelancers.map((block, i) => (
              <div key={`${block.project.id}-${i}`} className="py-4 first:pt-0 last:pb-0">
                <ProjectRecommendationBlock block={block} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
