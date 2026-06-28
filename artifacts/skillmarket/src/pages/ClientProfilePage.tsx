import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { ArrowLeft, Building2, Globe, MessageCircle, Flag, CheckCircle, Calendar, ExternalLink } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/common/Avatar";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ReportModal from "../components/common/ReportModal";
import { formatDate, cn, formatCurrency } from "../lib/utils";

interface ClientProfile {
  id: number;
  name: string;
  avatarUrl: string | null;
  companyName: string | null;
  companyDescription: string | null;
  companyLogoUrl: string | null;
  website: string | null;
  isOnline: boolean;
  emailVerified?: boolean;
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
      setProjects(allProjects.filter((p: { clientId?: number }) => p.clientId === clientId));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;
  if (!profile) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2">Client not found</h2><p className="text-gray-500 mb-6">This profile may have been removed.</p><Link href="/projects" className="btn-primary">Browse Projects</Link></div>;

  const completedProjects = projects.filter(p => p.status === "completed").length;
  const activeProjects = projects.filter(p => p.status === "open" || p.status === "in_progress").length;

  return (
    <div className="page-container animate-in">
      <Link href="/projects" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 mb-8 transition-colors shadow-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden relative">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
            <div className="px-8 pb-8 -mt-12 text-center">
              <div className="relative inline-block mb-4">
                {profile.companyLogoUrl ? (
                  <div className="p-1 bg-white rounded-2xl shadow-sm">
                    <img src={profile.companyLogoUrl} alt={profile.companyName ?? profile.name} className="w-24 h-24 rounded-xl object-cover border border-gray-100" />
                  </div>
                ) : (
                  <div className="p-1.5 bg-white rounded-full shadow-sm">
                    <Avatar name={profile.companyName ?? profile.name} avatarUrl={profile.avatarUrl ?? undefined} size="2xl" />
                  </div>
                )}
                <span className={cn(
                  "absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                  profile.isOnline ? "bg-green-500" : "bg-gray-300"
                )} />
              </div>
              
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{profile.companyName ?? profile.name}</h1>
              {profile.companyName && (
                <p className="text-sm font-medium text-gray-500 mb-3">Contact: {profile.name}</p>
              )}

              {profile.emailVerified && (
                <div className="flex items-center justify-center gap-1.5 mb-4 bg-indigo-50 py-1.5 px-3 rounded-full inline-flex mx-auto">
                  <CheckCircle size={16} className="text-indigo-600" />
                  <span className="text-xs text-indigo-700 font-bold uppercase tracking-wider">Verified Client</span>
                </div>
              )}

              {profile.website && (
                <a href={profile.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-6 bg-gray-50 py-2 rounded-lg border border-gray-100 transition-colors">
                  <Globe size={16} /> {new URL(profile.website).hostname}
                </a>
              )}

              {user && user.id !== clientId && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <Link href={`/messages?recipient=${clientId}`} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gray-900 hover:bg-black text-white text-base font-bold rounded-xl transition-colors shadow-md">
                    <MessageCircle size={18} /> Send Message
                  </Link>
                  <button onClick={() => setShowReport(true)} className="w-full flex items-center justify-center gap-2 py-2 mt-2 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors">
                    <Flag size={14} /> Report this client
                  </button>
                </div>
              )}
              {!user && (
                <div className="pt-4 border-t border-gray-100">
                  <Link href="/login" className="btn-primary w-full justify-center py-3.5 text-base">Sign In to Contact</Link>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6 pb-2 border-b border-gray-100">Client Activity</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Calendar size={16} className="text-gray-500" />
                  </div>
                  <span className="text-sm font-medium">Member since</span>
                </div>
                <span className="font-bold text-gray-900">{formatDate(profile.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Building2 size={16} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Total projects</span>
                </div>
                <span className="font-bold text-gray-900">{projects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <span className="font-bold text-green-700">{completedProjects}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - 8 cols */}
        <div className="lg:col-span-8 space-y-8">
          {profile.companyDescription && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Building2 size={24} className="text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">About the Client</h2>
              </div>
              <div className="prose prose-indigo max-w-none prose-p:leading-relaxed prose-p:text-gray-600">
                <p className="whitespace-pre-wrap">{profile.companyDescription}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">{projects.length} Total</span>
            </div>
            
            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.slice(0, 6).map(project => (
                  <Link key={project.id} href={`/projects/${project.id}`}
                    className="group border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all duration-300 flex flex-col bg-white">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-md">{project.category}</span>
                      {project.status === "completed" && <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md uppercase"><CheckCircle size={12} /> Done</span>}
                      {project.status === "open" && <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md uppercase">Open</span>}
                      {project.status === "in_progress" && <span className="text-xs font-bold text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-md uppercase">Active</span>}
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">{project.title}</h3>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="font-bold text-gray-900">{formatCurrency(project.budgetMin)} - {formatCurrency(project.budgetMax)}</div>
                      <div className="text-xs font-medium text-gray-400 flex items-center gap-1 group-hover:text-indigo-500 transition-colors">
                        View Details <ExternalLink size={12} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-10 text-center">
                <Building2 size={40} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">No projects posted yet</h3>
                <p className="text-gray-500">This client hasn't posted any public projects.</p>
              </div>
            )}
            
            {projects.length > 6 && (
              <div className="mt-8 text-center">
                <Link href={`/projects?search=${profile.name}`} className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm">
                  View all {projects.length} projects →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
