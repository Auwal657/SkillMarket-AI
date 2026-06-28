import { Link } from "wouter";
import { DollarSign, FileText, CheckCircle, Eye, Star, Zap, ArrowRight, TrendingUp, RefreshCw, BarChart2, Clock } from "lucide-react";
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
    { icon: DollarSign, label: "Total Earnings", value: formatCurrency(dashboard?.totalEarnings ?? 0), color: "text-green-600 bg-green-50/50 border-green-100" },
    { icon: FileText, label: "Active Applications", value: dashboard?.activeApplications ?? 0, color: "text-blue-600 bg-blue-50/50 border-blue-100" },
    { icon: CheckCircle, label: "Accepted", value: dashboard?.acceptedApplications ?? 0, color: "text-indigo-600 bg-indigo-50/50 border-indigo-100" },
    { icon: Eye, label: "Profile Views", value: dashboard?.profileViews ?? 0, color: "text-purple-600 bg-purple-50/50 border-purple-100" },
  ];

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetAiRecommendationsQueryKey() });
    refetchRecs();
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.name?.split(" ")[0]}!</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your freelance career.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/projects" className="btn-secondary">Browse Projects</Link>
          <Link href="/profile/skills" className="btn-primary">Manage Skills</Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="card p-6 border shadow-sm flex flex-col hover:-translate-y-1 transition-transform">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications */}
        <div className="lg:col-span-2">
          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
              <h2 className="font-semibold text-gray-900 text-lg">Recent Applications</h2>
              <Link href="/applications" className="text-sm font-medium text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors">
                View all <ArrowRight size={16} />
              </Link>
            </div>
            {dashboard?.recentApplications && dashboard.recentApplications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {dashboard.recentApplications.slice(0, 6).map(app => (
                  <div key={app.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-gray-50 transition-colors group">
                    <div className="min-w-0 mb-3 sm:mb-0">
                      <Link href={`/projects/${app.projectId}`} className="font-medium text-gray-900 hover:text-indigo-600 block truncate transition-colors text-base">
                        {app.projectTitle ?? "Project"}
                      </Link>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Clock size={14} className="text-gray-400" /> {formatRelativeTime(app.createdAt)}</span>
                        <span className="flex items-center gap-1"><DollarSign size={14} className="text-gray-400" /> {formatCurrency(app.proposedRate)}/hr</span>
                      </div>
                    </div>
                    <span className={cn("badge sm:ml-3 flex-shrink-0 self-start sm:self-auto", getStatusColor(app.status))}>
                      {app.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-4 text-gray-400">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <FileText className="text-gray-300" size={32} />
                </div>
                <h3 className="text-gray-900 font-medium text-lg mb-1">No applications yet</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Start applying to projects to see your application history here.</p>
                <Link href="/projects" className="mt-6 btn-primary text-sm inline-flex">Browse Projects</Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions + Rating */}
        <div className="space-y-6">
          <div className="card p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/30">
              <h2 className="font-semibold text-gray-900 text-lg">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-1">
              <Link href="/profile/edit" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                  <TrendingUp size={16} />
                </div>
                Update Profile
              </Link>
              <Link href="/profile/skills" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 group">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Zap size={16} />
                </div>
                Manage Skills
              </Link>
              <Link href="/profile/portfolio" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 group">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                  <FileText size={16} />
                </div>
                Portfolio Items
              </Link>
              <Link href="/saved" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 group">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <Star size={16} />
                </div>
                Saved Projects
              </Link>
              <div className="pt-2 px-2">
                <Link href="/dashboard/analytics" className="w-full btn-secondary text-sm flex items-center justify-center gap-2 group">
                  <BarChart2 size={16} className="text-gray-500 group-hover:text-indigo-600 transition-colors" /> 
                  View My Analytics
                </Link>
              </div>
            </div>
          </div>
          {dashboard?.averageRating && (
            <div className="card p-8 text-center bg-gradient-to-b from-white to-gray-50 border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mb-4 border border-amber-100 shadow-sm">
                <Star className="fill-amber-400 text-amber-400" size={32} />
              </div>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">{dashboard.averageRating.toFixed(1)}</p>
              <p className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">Average Rating</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Zap size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">AI-Matched Projects</h2>
            </div>
            <p className="text-sm text-gray-500 pl-10">Projects recommended based on your skills and profile</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={recFetching}
            className="btn-secondary text-sm px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw size={16} className={cn(recFetching ? "animate-spin" : "", "text-indigo-600")} />
            {recFetching ? "Refreshing…" : "Refresh Matches"}
          </button>
        </div>

        {recFetching && !recommendations && (
          <div className="flex justify-center py-20 bg-white rounded-2xl border border-gray-100"><LoadingSpinner size="md" /></div>
        )}

        {!recFetching && recommendations && recommendations.length === 0 && (
          <div className="card p-12 text-center text-gray-400 border-dashed border-2">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Zap className="text-gray-300" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches right now</h3>
            <p className="text-base text-gray-500 max-w-md mx-auto mb-6">We couldn't find active projects matching your specific skill set. Try adding more skills to broaden your matches.</p>
            <Link href="/profile/skills" className="btn-primary">Update Skills Profile</Link>
          </div>
        )}

        {recommendations && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recommendations.slice(0, 6).map(rec => (
              <div key={rec.project.id} className="relative group flex flex-col h-full">
                {/* Match score overlay */}
                <div className="absolute top-4 right-4 z-10">
                  <MatchScoreBadge score={rec.matchScore} />
                </div>
                <div className="flex-grow">
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
                </div>
                {/* Match reasons */}
                {rec.matchReasons && rec.matchReasons.length > 0 && (
                  <div className="mt-3 px-1 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Zap size={12} className="text-indigo-400" /> Match Insights
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.matchReasons.map((reason, i) => (
                        <span key={i} className="text-[11px] font-medium text-indigo-700 bg-indigo-50/80 border border-indigo-100/50 px-2.5 py-1 rounded-md">
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
