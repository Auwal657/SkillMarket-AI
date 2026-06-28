import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Clock, DollarSign, Users, Calendar, ArrowLeft, Send, CheckCircle, Bookmark, ThumbsUp, ThumbsDown, CheckSquare, Share2, Flag, ExternalLink, Activity } from "lucide-react";
import ReportModal from "../components/common/ReportModal";
import {
  useGetProject, useApplyToProject, useListProjectApplications,
  useUpdateApplicationStatus, useListMyApplications,
} from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SkillBadge from "../components/common/SkillBadge";
import Avatar from "../components/common/Avatar";
import { formatCurrency, formatDate, getStatusColor, cn } from "../lib/utils";
import EscrowPanel from "../components/common/EscrowPanel";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const pid = parseInt(id, 10);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ coverLetter: "", proposedRate: "" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [updatingAppId, setUpdatingAppId] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const { data: project, isLoading, refetch: refetchProject } = useGetProject(pid, { query: { enabled: !!pid, queryKey: ["project", pid] } });
  const { data: applications, refetch: refetchApps } = useListProjectApplications(pid, {
    query: { enabled: !!user && user.role === "client" && !!pid, queryKey: ["project-apps", pid] },
  });
  const { data: myApplications } = useListMyApplications({
    query: { enabled: !!user && user.role === "freelancer", queryKey: ["my-applications"] },
  });

  const applyMutation = useApplyToProject();
  const updateStatusMutation = useUpdateApplicationStatus();

  const alreadyApplied = user?.role === "freelancer" && (myApplications ?? []).some(a => a.projectId === pid);

  useEffect(() => {
    if (!user || !pid) return;
    fetch(`/api/saved/check?itemType=project&itemId=${pid}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (d.saved !== undefined) setIsSaved(d.saved); })
      .catch(() => {});
  }, [pid, user]);

  const handleSaveProject = async () => {
    if (!user) { navigate("/login"); return; }
    setSavingProject(true);
    try {
      if (isSaved) {
        await fetch(`/api/saved?itemType=project&itemId=${pid}`, { method: "DELETE", credentials: "include" });
      } else {
        await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ itemType: "project", itemId: pid }),
        });
      }
      setIsSaved(!isSaved);
    } catch {
      setSaveError("Failed to save project. Please try again.");
      setTimeout(() => setSaveError(""), 3000);
    } finally {
      setSavingProject(false);
    }
  };

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
      queryClient.invalidateQueries({ queryKey: ["/api/applications/my"] });
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to apply";
      setError(msg);
    }
  };

  const handleUpdateStatus = async (appId: number, status: "accepted" | "rejected") => {
    setUpdatingAppId(appId);
    try {
      await updateStatusMutation.mutateAsync({ id: appId, data: { status } });
      await refetchApps();
      queryClient.invalidateQueries({ queryKey: ["/api/projects", pid] });
      await refetchProject();
    } catch {
      alert(`Failed to ${status} application`);
    } finally {
      setUpdatingAppId(null);
    }
  };

  const handleMarkComplete = async () => {
    if (!confirm("Mark this project as complete? This will notify the freelancer and allow you to leave a review.")) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/projects/${pid}/complete`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.error ?? "Failed to mark project complete");
        return;
      }
      await refetchProject();
      queryClient.invalidateQueries({ queryKey: ["/api/projects", pid] });
    } catch {
      alert("Failed to mark project complete");
    } finally {
      setCompleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      prompt("Copy this link:", url);
    }
  };

  useEffect(() => {
    if (!project) return;
    const prev = document.title;
    document.title = `${project.title} — SkillMarket AI`;
    const setMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); prop ? el.setAttribute("property", name) : el.setAttribute("name", name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    const desc = project.description.slice(0, 200);
    setMeta("description", desc);
    setMeta("og:title", `${project.title} — SkillMarket AI`, true);
    setMeta("og:description", desc, true);
    setMeta("og:url", window.location.href, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:title", `${project.title} — SkillMarket AI`);
    setMeta("twitter:description", desc);
    return () => { document.title = prev; };
  }, [project]);

  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;
  if (!project) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><Activity size={48} className="text-gray-300 mb-4" /><h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2><p className="text-gray-500 mb-6">This project may have been removed or doesn't exist.</p><Link href="/projects" className="btn-primary">Browse Projects</Link></div>;

  const isOwner = user?.id === project.clientId;
  const canApply = user?.role === "freelancer" && !isOwner;
  const hasAcceptedApp = applications?.some(a => a.status === "accepted");
  const acceptedApp = applications?.find(a => a.status === "accepted") as (typeof applications extends (infer T)[] | undefined ? T : never) & { freelancerProfileId?: number | null } | undefined;

  return (
    <div className="page-container animate-in">
      <Link href="/projects" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 mb-8 transition-colors shadow-sm">
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      {showReport && user && (
        <ReportModal
          targetType="project"
          targetId={pid}
          targetLabel={project.title}
          onClose={() => setShowReport(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8 md:p-10 border-b border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-md">{project.category}</span>
                  <span className={cn("px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md", getStatusColor(project.status))}>{project.status.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleShare} className={cn("flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors shadow-sm", shareCopied ? "text-green-700 border-green-200 bg-green-50" : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50")}>
                    <Share2 size={16} /> {shareCopied ? "Copied!" : "Share"}
                  </button>
                  {user && !isOwner && (
                    <button onClick={() => setShowReport(true)} className="flex items-center justify-center p-2 text-gray-400 border border-gray-200 bg-white rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm" aria-label="Report project">
                      <Flag size={18} />
                    </button>
                  )}
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">{project.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                    {project.clientName?.charAt(0) || "C"}
                  </div>
                  <span className="font-medium text-gray-900">{project.clientName ?? "Client"}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>Posted {formatDate(project.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="p-8 md:p-10">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity size={20} className="text-indigo-500" /> Project Description
              </h2>
              <div className="prose prose-indigo max-w-none prose-p:leading-relaxed prose-p:text-gray-600">
                <p className="whitespace-pre-wrap">{project.description}</p>
              </div>
            </div>
          </div>

          {project.requiredSkills && project.requiredSkills.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Required Skills</h2>
              <div className="flex flex-wrap gap-3">
                {project.requiredSkills.map(s => <SkillBadge key={s} name={s} variant="purple" />)}
              </div>
            </div>
          )}

          {isOwner && applications && applications.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">Applications <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-sm ml-2">{applications.length}</span></h2>
              </div>
              <div className="divide-y divide-gray-100">
                {applications.map(app => (
                  <div key={app.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                      <div className="flex items-start gap-4">
                        <Avatar name={app.freelancerName ?? "F"} size="md" />
                        <div>
                          <Link href={`/freelancers/${app.freelancerId}`} className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors">{app.freelancerName ?? "Freelancer"}</Link>
                          {app.freelancerHeadline && <p className="text-sm font-medium text-gray-500 mt-0.5">{app.freelancerHeadline}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xl font-bold text-gray-900">{formatCurrency(app.proposedRate)}<span className="text-sm font-normal text-gray-500">/hr</span></span>
                        <span className={cn("px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md", getStatusColor(app.status))}>{app.status}</span>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
                      <p className="text-sm text-gray-600 leading-relaxed italic">"{app.coverLetter}"</p>
                    </div>
                    {app.status === "pending" && !hasAcceptedApp && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdateStatus(app.id, "accepted")}
                          disabled={updatingAppId === app.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                        >
                          {updatingAppId === app.id ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <ThumbsUp size={16} />}
                          Accept Proposal
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, "rejected")}
                          disabled={updatingAppId === app.id}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-white hover:bg-red-50 text-red-700 text-sm font-medium border border-gray-200 hover:border-red-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {updatingAppId === app.id ? <span className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" /> : <ThumbsDown size={16} />}
                          Reject
                        </button>
                      </div>
                    )}
                    {app.status === "accepted" && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg border border-green-100">
                        <CheckCircle size={16} /> Accepted — you are working with this freelancer
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwner && applications && applications.length === 0 && (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-12 text-center">
              <Users size={40} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">No applications yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">Applications will appear here once freelancers start applying to your project.</p>
            </div>
          )}

          {canApply && project.status === "open" && (
            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply to this Project</h2>
                {success || alreadyApplied ? (
                  <div className="flex items-center gap-4 bg-green-50 text-green-800 p-6 rounded-xl border border-green-200 shadow-sm">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 text-lg mb-1">
                        {alreadyApplied && !success ? "Application Sent" : "Success!"}
                      </h3>
                      <p className="text-green-700">
                        {alreadyApplied && !success 
                          ? "You have already applied to this project. The client will review your proposal." 
                          : "Your application has been submitted successfully."}
                      </p>
                    </div>
                  </div>
                ) : applying ? (
                  <form onSubmit={handleApply} className="space-y-6">
                    {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-start gap-3"><Flag size={18} className="mt-0.5 flex-shrink-0" /><p>{error}</p></div>}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                      <label className="block text-sm font-bold text-gray-900 mb-2">Your Proposed Hourly Rate (USD)</label>
                      <div className="relative max-w-xs">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="number" min="1" step="0.01" value={form.proposedRate} onChange={e => setForm(f => ({ ...f, proposedRate: e.target.value }))} className="input pl-11 py-3 text-lg font-bold" placeholder="e.g. 25.00" required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">Cover Letter</label>
                      <p className="text-sm text-gray-500 mb-3">Introduce yourself, explain why you're a strong fit, and highlight relevant past work.</p>
                      <textarea value={form.coverLetter} onChange={e => setForm(f => ({ ...f, coverLetter: e.target.value }))} className="input min-h-[200px] p-4 text-base" placeholder="Write a compelling proposal..." required />
                      <div className="flex justify-between items-center mt-2">
                        <p className={cn("text-xs font-medium", form.coverLetter.length < 50 ? "text-red-500" : "text-green-600")}>{form.coverLetter.length} / 50 min characters</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button type="submit" disabled={applyMutation.isPending} className="btn-primary py-3.5 px-8 text-base">
                        {applyMutation.isPending ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Send size={18} /> Submit Proposal</>}
                      </button>
                      <button type="button" onClick={() => { setApplying(false); setError(""); }} className="btn-secondary py-3.5 px-8 text-base">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div>
                    {!user ? (
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                        <p className="text-gray-600 mb-4 font-medium">You need an account to apply to projects.</p>
                        <Link href="/login" className="btn-primary inline-flex">Sign in to Apply</Link>
                      </div>
                    ) : (
                      <button onClick={() => setApplying(true)} className="btn-primary py-4 px-8 text-lg w-full sm:w-auto justify-center shadow-md hover:shadow-lg"><Send size={20} /> Submit a Proposal</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {canApply && project.status !== "open" && (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-2xl p-8 text-center">
              <CheckCircle size={32} className="mx-auto text-gray-400 mb-3" />
              <p className="text-lg font-medium text-gray-700">This project is no longer accepting applications.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Project Overview</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign size={24} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Budget Range</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(project.budgetMin)} <span className="text-gray-400 font-normal mx-1">–</span> {formatCurrency(project.budgetMax)}</p>
                </div>
              </div>
              {project.timelineWeeks && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Expected Timeline</p>
                    <p className="text-lg font-bold text-gray-900">{project.timelineWeeks} weeks</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Users size={24} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Proposals</p>
                  <p className="text-lg font-bold text-gray-900">{project.applicationCount ?? 0}</p>
                </div>
              </div>
            </div>
          </div>

          {isOwner && project.status === "in_progress" && (
            <div className="bg-gray-900 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <h3 className="text-lg font-bold mb-2 relative z-10">Project Management</h3>
              <p className="text-gray-300 text-sm mb-6 relative z-10">When the work is finalized, mark the project as complete to proceed to reviews.</p>
              <button
                onClick={handleMarkComplete}
                disabled={completing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-gray-900 text-sm font-bold transition-all shadow-md disabled:opacity-50 relative z-10"
              >
                {completing
                  ? <span className="animate-spin w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full" />
                  : <CheckSquare size={18} />}
                {completing ? "Completing..." : "Mark Work as Complete"}
              </button>
            </div>
          )}

          {isOwner && project.status === "completed" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-green-900 mb-2">Project Completed</h3>
              <p className="text-green-700 text-sm mb-6">Great job! This project is officially closed.</p>
              {acceptedApp?.freelancerProfileId && (
                <Link
                  href={`/freelancers/${acceptedApp.freelancerProfileId}`}
                  className="inline-flex items-center justify-center w-full px-4 py-3 bg-white text-green-700 font-bold text-sm border border-green-200 rounded-xl hover:bg-green-50 transition-colors shadow-sm"
                >
                  Leave a Review →
                </Link>
              )}
            </div>
          )}

          {user && !isOwner && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <button
                onClick={handleSaveProject}
                disabled={savingProject}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border text-sm font-bold transition-all",
                  isSaved
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm"
                )}
              >
                <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
                {savingProject ? "Saving..." : isSaved ? "Saved to Profile" : "Save for Later"}
              </button>
              {saveError && <p className="text-xs font-medium text-red-500 text-center mt-3">{saveError}</p>}
            </div>
          )}

          {["in_progress", "completed"].includes(project.status) && user && (
            <EscrowPanel
              projectId={pid}
              projectStatus={project.status}
              isClient={isOwner}
              isFreelancer={user.role === "freelancer" && !isOwner}
            />
          )}

          {isOwner && project.status === "open" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Administration</h3>
              <Link href={`/projects/${pid}/edit`} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                Edit Project Details
              </Link>
            </div>
          )}

          {!user && (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <Users size={32} className="mx-auto text-gray-400 mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">Interested in this project?</h3>
              <p className="text-sm text-gray-600 mb-6">Join SkillMarket to submit a proposal and start working.</p>
              <div className="space-y-3">
                <Link href="/register" className="btn-primary w-full justify-center py-3">Create an Account</Link>
                <Link href="/login" className="block text-sm font-medium text-indigo-600 hover:text-indigo-800">Already have an account? Sign in</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
