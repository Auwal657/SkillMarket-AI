import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Clock, DollarSign, Users, Calendar, ArrowLeft, Send, CheckCircle, Bookmark, ThumbsUp, ThumbsDown, CheckSquare, Share2, Flag } from "lucide-react";
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

  // OG / SEO meta update for project page
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

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!project) return <div className="text-center py-20 text-gray-500">Project not found</div>;

  const isOwner = user?.id === project.clientId;
  const canApply = user?.role === "freelancer" && !isOwner;
  const hasAcceptedApp = applications?.some(a => a.status === "accepted");
  const acceptedApp = applications?.find(a => a.status === "accepted") as (typeof applications extends (infer T)[] | undefined ? T : never) & { freelancerProfileId?: number | null } | undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/projects" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
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
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-8">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span className="badge bg-indigo-100 text-indigo-700">{project.category}</span>
                <span className={cn("badge", getStatusColor(project.status))}>{project.status.replace("_", " ")}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={handleShare} className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-xl transition-colors", shareCopied ? "text-green-700 border-green-200 bg-green-50" : "text-gray-500 border-gray-200 hover:bg-gray-50")}>
                  <Share2 size={13} /> {shareCopied ? "Copied!" : "Share"}
                </button>
                {user && !isOwner && (
                  <button onClick={() => setShowReport(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-gray-200 rounded-xl hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
                    <Flag size={13} /> Report
                  </button>
                )}
              </div>
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
                  <div key={app.id} className="p-4 border border-gray-100 rounded-xl hover:border-indigo-100 transition-colors">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={app.freelancerName ?? "F"} size="sm" />
                        <div>
                          <Link href={`/freelancers/${app.freelancerId}`} className="font-medium text-indigo-600 hover:text-indigo-800 text-sm">{app.freelancerName ?? "Freelancer"}</Link>
                          {app.freelancerHeadline && <p className="text-xs text-gray-400">{app.freelancerHeadline}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("badge", getStatusColor(app.status))}>{app.status}</span>
                        <span className="font-semibold text-gray-900 text-sm">{formatCurrency(app.proposedRate)}/hr</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">{app.coverLetter}</p>
                    {app.status === "pending" && !hasAcceptedApp && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(app.id, "accepted")}
                          disabled={updatingAppId === app.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {updatingAppId === app.id ? <span className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full" /> : <ThumbsUp size={12} />}
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app.id, "rejected")}
                          disabled={updatingAppId === app.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                        >
                          {updatingAppId === app.id ? <span className="animate-spin w-3 h-3 border border-red-600 border-t-transparent rounded-full" /> : <ThumbsDown size={12} />}
                          Reject
                        </button>
                      </div>
                    )}
                    {app.status === "accepted" && (
                      <div className="flex items-center gap-1.5 text-green-700 text-xs font-medium">
                        <CheckCircle size={12} /> Accepted — working with this freelancer
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isOwner && applications && applications.length === 0 && (
            <div className="card p-6 text-center text-gray-400 text-sm">No applications yet. Share your project to attract talent.</div>
          )}

          {/* Apply form */}
          {canApply && project.status === "open" && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Apply to this Project</h2>
              {success || alreadyApplied ? (
                <div className="flex items-center gap-3 text-green-700 bg-green-50 rounded-xl p-4">
                  <CheckCircle size={20} />
                  {alreadyApplied && !success ? "You've already applied to this project." : "Application submitted successfully!"}
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
                    <button type="button" onClick={() => { setApplying(false); setError(""); }} className="btn-secondary">Cancel</button>
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

          {/* Mark Complete button — visible to client when project is in_progress */}
          {isOwner && project.status === "in_progress" && (
            <button
              onClick={handleMarkComplete}
              disabled={completing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {completing
                ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                : <CheckSquare size={16} />}
              {completing ? "Completing..." : "Mark as Complete"}
            </button>
          )}

          {isOwner && project.status === "completed" && (
            <div className="card p-4 bg-green-50 border-green-200 text-center">
              <CheckCircle size={20} className="text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">Project Completed</p>
              {acceptedApp?.freelancerProfileId ? (
                <Link
                  href={`/freelancers/${acceptedApp.freelancerProfileId}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 underline hover:text-green-900"
                >
                  Leave a review for {acceptedApp.freelancerName ?? "the freelancer"} →
                </Link>
              ) : (
                <p className="text-xs text-green-600 mt-1">You can now review the freelancer</p>
              )}
            </div>
          )}

          {user && !isOwner && (
            <>
              <button
                onClick={handleSaveProject}
                disabled={savingProject}
                className={cn(
                  "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                  isSaved
                    ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
                {savingProject ? "Saving..." : isSaved ? "Saved" : "Save Project"}
              </button>
              {saveError && <p className="text-xs text-red-500 text-center">{saveError}</p>}
            </>
          )}

          {isOwner && project.status === "open" && (
            <Link href={`/projects/${pid}/edit`} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Edit Project
            </Link>
          )}

          {!user && (
            <div className="card p-6 text-center">
              <p className="text-sm text-gray-600 mb-4">Sign in to apply or save this project</p>
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
