import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Building2, Globe, MessageCircle, Flag, CheckCircle, Calendar, Star } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/common/Avatar";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ReportModal from "../components/common/ReportModal";
import { formatDate, cn } from "../lib/utils";

interface ClientProfile {
  id: number;
  name: string;
  avatarUrl: string | null;
  companyName: string | null;
  companyDescription: string | null;
  companyLogoUrl: string | null;
  website: string | null;
  isOnline: boolean;
  createdAt: string;
}

interface ClientProject {
  id: number;
  title: string;
  status: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  createdAt: string;
}

export default function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const clientId = parseInt(id, 10);
  const { user } = useAuth();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!clientId || isNaN(clientId)) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/users/${clientId}/client-profile`).then(r => r.ok ? r.json() : null),
      fetch(`/api/projects?limit=50&offset=0`).then(r => r.ok ? r.json() : []),
    ]).then(([prof, allProjects]) => {
      setProfile(prof);
      const clientProjects = (allProjects as ClientProject[]).filter(
        (p: ClientProject & { clientId?: number }) => p.clientId === clientId || true
      );
      setProjects(allProjects.filter((p: { clientId?: number }) => p.clientId === clientId));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!profile) return <div className="text-center py-20 text-gray-500">Client profile not found</div>;

  const completedProjects = projects.filter(p => p.status === "completed").length;
  const activeProjects = projects.filter(p => p.status === "open" || p.status === "in_progress").length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/projects" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      {showReport && user && (
        <ReportModal
          targetType="user"
          targetId={clientId}
          targetLabel={profile.name}
          onClose={() => setShowReport(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-6 text-center">
            {profile.companyLogoUrl ? (
              <img src={profile.companyLogoUrl} alt={profile.companyName ?? profile.name} className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 border border-gray-100" />
            ) : (
              <div className="relative inline-block mb-4">
                <Avatar name={profile.name} avatarUrl={profile.avatarUrl ?? undefined} size="xl" />
                <span className={cn(
                  "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white",
                  profile.isOnline ? "bg-green-500" : "bg-gray-300"
                )} />
              </div>
            )}
            <h1 className="text-xl font-bold text-gray-900 mb-1">{profile.companyName ?? profile.name}</h1>
            {profile.companyName && (
              <p className="text-sm text-gray-500 mb-2">by {profile.name}</p>
            )}
            <div className="flex items-center justify-center gap-1.5 text-xs mb-4">
              <span className={cn("w-2 h-2 rounded-full", profile.isOnline ? "bg-green-500" : "bg-gray-300")} />
              <span className={profile.isOnline ? "text-green-600" : "text-gray-400"}>
                {profile.isOnline ? "Online" : "Offline"}
              </span>
            </div>

            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 mb-4">
                <Globe size={14} /> {new URL(profile.website).hostname}
              </a>
            )}

            {user && user.id !== clientId && (
              <div className="space-y-2 mt-4">
                <Link href={`/messages?recipient=${clientId}`} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
                  <MessageCircle size={15} /> Send Message
                </Link>
                <button onClick={() => setShowReport(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-xl hover:border-red-200 transition-colors">
                  <Flag size={13} /> Report
                </button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Member since</span>
                <span className="font-medium text-gray-900">{formatDate(profile.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total projects</span>
                <span className="font-medium text-gray-900">{projects.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed</span>
                <span className="font-medium text-green-700">{completedProjects}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active now</span>
                <span className="font-medium text-indigo-700">{activeProjects}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {profile.companyDescription && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-indigo-500" />
                <h2 className="font-semibold text-gray-900">About</h2>
              </div>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.companyDescription}</p>
            </div>
          )}

          {projects.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Projects</h2>
              <div className="space-y-3">
                {projects.slice(0, 6).map(project => (
                  <Link key={project.id} href={`/projects/${project.id}`}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 group-hover:text-indigo-700 truncate">{project.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{project.category} · {formatDate(project.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {project.status === "completed" && (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
                          <CheckCircle size={10} /> Done
                        </span>
                      )}
                      {project.status === "open" && (
                        <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full">Open</span>
                      )}
                      {project.status === "in_progress" && (
                        <span className="text-xs text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">Active</span>
                      )}
                    </div>
                  </Link>
                ))}
                {projects.length > 6 && (
                  <Link href={`/projects?search=${profile.name}`} className="block text-center text-sm text-indigo-600 hover:text-indigo-800 pt-2">
                    View all {projects.length} projects →
                  </Link>
                )}
              </div>
            </div>
          )}

          {projects.length === 0 && !profile.companyDescription && (
            <div className="card p-12 text-center text-gray-400">
              <Building2 size={32} className="mx-auto mb-3 opacity-30" />
              <p>No public information yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
