import { Link } from "wouter";
import { DollarSign, FileText, CheckCircle, Eye, Star, Zap, ArrowRight, TrendingUp, RefreshCw } from "lucide-react";
import { useGetFreelancerDashboard, useGetAiRecommendations, getGetAiRecommendationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ProjectCard from "../../components/common/ProjectCard";
import { formatCurrency, getStatusColor, formatRelativeTime, cn } from "../../lib/utils";

function MatchScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-600" :
    score >= 60 ? "bg-indigo-600" :
    score >= 40 ? "bg-amber-500" : "bg-gray-500";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm ${color}`}>
      <Zap size={10} />
      {score}% match
    </span>
  );
}

export default function FreelancerDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: dashboard, isLoading } = useGetFreelancerDashboard();
  const {
    data: recommendations,
    isFetching: recFetching,
    refetch: refetchRecs,
  } = useGetAiRecommendations();

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  const stats = [
    { icon: DollarSign, label: "Total Earnings", value: formatCurrency(dashboard?.totalEarnings ?? 0), color: "text-green-600 bg-green-50" },
    { icon: FileText, label: "Active Applications", value: dashboard?.activeApplications ?? 0, color: "text-blue-600 bg-blue-50" },
    { icon: CheckCircle, label: "Accepted", value: dashboard?.acceptedApplications ?? 0, color: "text-indigo-600 bg-indigo-50" },
    { icon: Eye, label: "Profile Views", value: dashboard?.profileViews ?? 0, color: "text-purple-600 bg-purple-50" },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetAiRecommendationsQueryKey() });
    refetchRecs();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(" ")[0]}! 👋</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your freelance career.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/projects" className="btn-secondary text-sm py-2 px-4">Browse Projects</Link>
          <Link href="/profile/skills" className="btn-primary text-sm py-2 px-4">Manage Skills</Link>
        </div>
      </div>

      {/* Stats grid */}
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
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Recent Applications</h2>
              <Link href="/applications" className="text-sm text-indigo-600 flex items-center gap-1 hover:text-indigo-800">View all <ArrowRight size={14} /></Link>
            </div>
            {dashboard?.recentApplications && dashboard.recentApplications.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentApplications.slice(0, 6).map(app => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="min-w-0">
                      <Link href={`/projects/${app.projectId}`} className="font-medium text-sm text-gray-900 hover:text-indigo-600 block truncate">{app.projectTitle ?? "Project"}</Link>
                      <p className="text-xs text-gray-400">{formatRelativeTime(app.createdAt)} · {formatCurrency(app.proposedRate)}/hr</p>
                    </div>
                    <span className={cn("badge ml-3 flex-shrink-0", getStatusColor(app.status))}>{app.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText className="mx-auto mb-3 opacity-30" size={32} />
                <p className="text-sm">No applications yet. Start applying to projects!</p>
                <Link href="/projects" className="mt-3 btn-primary text-sm inline-flex">Browse Projects</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions + Rating */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/profile/edit" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <TrendingUp size={16} className="text-indigo-500" /> Update Profile
              </Link>
              <Link href="/profile/skills" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <Zap size={16} className="text-indigo-500" /> Manage Skills
              </Link>
              <Link href="/profile/portfolio" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <FileText size={16} className="text-indigo-500" /> Portfolio Items
              </Link>
              <Link href="/saved" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700">
                <Star size={16} className="text-indigo-500" /> Saved Projects
              </Link>
            </div>
          </div>
          {dashboard?.averageRating && (
            <div className="card p-6 text-center">
              <Star className="mx-auto mb-2 fill-amber-400 text-amber-400" size={24} />
              <p className="text-3xl font-bold text-gray-900">{dashboard.averageRating.toFixed(1)}</p>
              <p className="text-sm text-gray-500 mt-1">Average Rating</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-indigo-600" />
            <h2 className="font-semibold text-gray-900">AI-Matched Projects</h2>
            <span className="badge bg-indigo-100 text-indigo-700">Recommended for you</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={recFetching}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={recFetching ? "animate-spin" : ""} />
            {recFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {recFetching && !recommendations && (
          <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>
        )}

        {!recFetching && recommendations && recommendations.length === 0 && (
          <div className="card p-8 text-center text-gray-400">
            <Zap className="mx-auto mb-3 opacity-30" size={32} />
            <p className="font-medium text-gray-600 mb-1">No matches yet</p>
            <p className="text-sm">Add skills to your profile to get AI-matched project recommendations.</p>
            <Link href="/profile/skills" className="mt-4 btn-primary text-sm inline-flex">Add Skills</Link>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {recommendations.slice(0, 6).map(rec => (
              <div key={rec.project.id} className="relative group">
                {/* Match score overlay */}
                <div className="absolute top-3 right-3 z-10">
                  <MatchScoreBadge score={rec.matchScore} />
                </div>
                <ProjectCard
                  id={rec.project.id}
                  title={rec.project.title}
                  description={rec.project.description}
                  category={rec.project.category}
                  budgetMin={rec.project.budgetMin}
                  budgetMax={rec.project.budgetMax}
                  timelineWeeks={rec.project.timelineWeeks}
                  status={rec.project.status}
                  clientName={rec.project.clientName}
                  requiredSkills={rec.project.requiredSkills}
                  applicationCount={rec.project.applicationCount}
                  createdAt={rec.project.createdAt}
                />
                {/* Match reasons */}
                {rec.matchReasons && rec.matchReasons.length > 0 && (
                  <div className="mt-2 px-1 space-y-1">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Why this match</p>
                    <div className="flex flex-wrap gap-1">
                      {rec.matchReasons.map((reason, i) => (
                        <span key={i} className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
