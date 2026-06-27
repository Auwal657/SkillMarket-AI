import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Clock, DollarSign, Users, Calendar, ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useGetProject, useApplyToProject, useListProjectApplications } from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SkillBadge from "../components/common/SkillBadge";
import { formatCurrency, formatDate, getStatusColor, cn } from "../lib/utils";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pid = parseInt(id, 10);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ coverLetter: "", proposedRate: "" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { data: project, isLoading } = useGetProject(pid, { query: { enabled: !!pid, queryKey: ["project", pid] } });
  const { data: applications } = useListProjectApplications(pid, { query: { enabled: !!user && user.role === "client" && !!pid, queryKey: ["project-apps", pid] } });
  const applyMutation = useApplyToProject();

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) { navigate("/login"); return; }
    const rate = parseFloat(form.proposedRate);
    if (isNaN(rate) || rate <= 0) { setError("Please enter a valid proposed rate"); return; }
    if (form.coverLetter.trim().length < 50) { setError("Cover letter must be at least 50 characters"); return; }
    try {
      await applyMutation.mutateAsync({ data: { projectId: pid, coverLetter: form.coverLetter, proposedRate: rate } });
      setSuccess(true);
      setApplying(false);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to apply";
      setError(msg);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!project) return <div className="text-center py-20 text-gray-500">Project not found</div>;

  const isOwner = user?.id === project.clientId;
  const canApply = user?.role === "freelancer" && !isOwner;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/projects" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="badge bg-indigo-100 text-indigo-700">{project.category}</span>
              <span className={cn("badge", getStatusColor(project.status))}>{project.status.replace("_", " ")}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
            <p className="text-sm text-gray-400 mb-6">Posted by {project.clientName ?? "Client"} · {formatDate(project.createdAt)}</p>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>
          </div>

          {project.requiredSkills && project.requiredSkills.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {project.requiredSkills.map(s => <SkillBadge key={s} name={s} variant="purple" />)}
              </div>
            </div>
          )}

          {/* Applications (client only) */}
          {isOwner && applications && applications.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Applications ({applications.length})</h2>
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="p-4 border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/freelancers/${app.freelancerId}`} className="font-medium text-indigo-600 hover:text-indigo-800">{app.freelancerName ?? "Freelancer"}</Link>
                      <div className="flex items-center gap-2">
                        <span className={cn("badge", getStatusColor(app.status))}>{app.status}</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(app.proposedRate)}/hr</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-3">{app.coverLetter}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Apply form */}
          {canApply && project.status === "open" && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Apply to this Project</h2>
              {success ? (
                <div className="flex items-center gap-3 text-green-700 bg-green-50 rounded-xl p-4">
                  <CheckCircle size={20} /> Application submitted successfully!
                </div>
              ) : applying ? (
                <form onSubmit={handleApply} className="space-y-4">
                  {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
                  <div>
                    <label className="label">Your Hourly Rate (USD)</label>
                    <input type="number" min="1" step="0.01" value={form.proposedRate} onChange={e => setForm(f => ({ ...f, proposedRate: e.target.value }))} className="input" placeholder="e.g. 25" required />
                  </div>
                  <div>
                    <label className="label">Cover Letter <span className="text-gray-400 font-normal">(min. 50 characters)</span></label>
                    <textarea value={form.coverLetter} onChange={e => setForm(f => ({ ...f, coverLetter: e.target.value }))} className="input min-h-32" placeholder="Why are you a great fit for this project? Highlight relevant experience and skills..." required />
                    <p className="text-xs text-gray-400 mt-1">{form.coverLetter.length} characters</p>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" disabled={applyMutation.isPending} className="btn-primary">
                      {applyMutation.isPending ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><Send size={16} /> Submit Application</>}
                    </button>
                    <button type="button" onClick={() => setApplying(false)} className="btn-secondary">Cancel</button>
                  </div>
                </form>
              ) : (
                <div>
                  {!user ? (
                    <Link href="/login" className="btn-primary">Sign in to Apply</Link>
                  ) : (
                    <button onClick={() => setApplying(true)} className="btn-primary"><Send size={16} /> Apply Now</button>
                  )}
                </div>
              )}
            </div>
          )}
          {canApply && project.status !== "open" && (
            <div className="card p-6 text-center text-gray-500">This project is no longer accepting applications.</div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Project Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-gray-600">
                <DollarSign size={16} className="text-indigo-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Budget</p>
                  <p className="font-medium text-gray-900">{formatCurrency(project.budgetMin)} – {formatCurrency(project.budgetMax)}</p>
                </div>
              </div>
              {project.timelineWeeks && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock size={16} className="text-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Timeline</p>
                    <p className="font-medium text-gray-900">{project.timelineWeeks} weeks</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-gray-600">
                <Users size={16} className="text-indigo-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Applications</p>
                  <p className="font-medium text-gray-900">{project.applicationCount ?? 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Calendar size={16} className="text-indigo-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Posted</p>
                  <p className="font-medium text-gray-900">{formatDate(project.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {!user && (
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-600 mb-4">Sign in to apply or contact the client</p>
              <div className="space-y-2">
                <Link href="/login" className="btn-primary w-full justify-center">Sign In</Link>
                <Link href="/register" className="btn-secondary w-full justify-center text-sm">Create Account</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
