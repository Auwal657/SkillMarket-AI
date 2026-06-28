import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Save, Briefcase, X, Plus, DollarSign, Clock } from "lucide-react";
import { useGetProject, useUpdateProject, useListSkills } from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { cn } from "../lib/utils";

const CATEGORIES = ["Frontend", "Backend", "Mobile", "Design", "Data Science", "Writing", "Marketing", "Video", "Other"];

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const pid = parseInt(id, 10);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: project, isLoading } = useGetProject(pid, { query: { enabled: !!pid, queryKey: ["project", pid] } });
  const { data: skillsCatalog } = useListSkills();
  const updateMutation = useUpdateProject();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    budgetMin: "",
    budgetMax: "",
    timelineWeeks: "",
    requiredSkills: [] as string[],
    status: "open",
  });
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (project && !initialized) {
      setForm({
        title: project.title ?? "",
        description: project.description ?? "",
        category: project.category ?? "",
        budgetMin: String(project.budgetMin ?? ""),
        budgetMax: String(project.budgetMax ?? ""),
        timelineWeeks: String(project.timelineWeeks ?? ""),
        requiredSkills: project.requiredSkills ?? [],
        status: project.status ?? "open",
      });
      setInitialized(true);
    }
  }, [project, initialized]);

  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;
  if (!project) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2><Link href="/dashboard" className="btn-primary mt-4">Go to Dashboard</Link></div>;
  if (user?.id !== project.clientId) {
    return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2><p className="text-gray-500">You don't have permission to edit this project.</p></div>;
  }

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed || form.requiredSkills.includes(trimmed)) return;
    setForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, trimmed] }));
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter(s => s !== skill) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const budgetMin = parseFloat(form.budgetMin);
    const budgetMax = parseFloat(form.budgetMax);
    if (isNaN(budgetMin) || isNaN(budgetMax) || budgetMin <= 0 || budgetMax <= 0) {
      setError("Please enter valid budget values");
      return;
    }
    if (budgetMin > budgetMax) {
      setError("Minimum budget cannot exceed maximum budget");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: pid,
        data: {
          title: form.title,
          description: form.description,
          category: form.category,
          budgetMin,
          budgetMax,
          timelineWeeks: form.timelineWeeks ? parseInt(form.timelineWeeks) : undefined,
          requiredSkills: form.requiredSkills,
          status: form.status as "open" | "in_progress" | "completed" | "cancelled",
        },
      });
      setSuccess(true);
      setTimeout(() => navigate(`/projects/${pid}`), 1500);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to update project";
      setError(msg);
    }
  };

  return (
    <div className="page-container max-w-4xl animate-in">
      <Link href={`/projects/${pid}`} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 mb-8 transition-colors shadow-sm">
        <ArrowLeft size={16} /> Back to Project
      </Link>

      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">Edit Project Details</h1>
        <p className="text-lg text-gray-600">Update the information for "{project.title}"</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm font-bold rounded-xl px-6 py-4 flex items-center gap-3 shadow-sm">
            <span className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">✓</span>
            Project updated successfully! Redirecting...
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-6 py-4 flex items-center gap-3 shadow-sm">
            <span className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600"><X size={16} /></span>
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. Basic Details & Status</h2>
            </div>
            <div>
              <select 
                value={form.status} 
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))} 
                className={cn(
                  "input font-bold text-sm py-2 shadow-sm",
                  form.status === 'open' ? "bg-blue-50 text-blue-800 border-blue-200" :
                  form.status === 'in_progress' ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                  form.status === 'completed' ? "bg-green-50 text-green-800 border-green-200" :
                  "bg-red-50 text-red-800 border-red-200"
                )}
              >
                <option value="open">STATUS: OPEN</option>
                <option value="in_progress">STATUS: IN PROGRESS</option>
                <option value="completed">STATUS: COMPLETED</option>
                <option value="cancelled">STATUS: CANCELLED</option>
              </select>
            </div>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Project Title <span className="text-red-500">*</span></label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input text-lg py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Category <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input py-3" required>
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">2. Scope & Requirements</h2>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Description <span className="text-red-500">*</span></label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input min-h-[200px] p-4 text-base"
                required
              />
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-2">Required Skills</label>
              <div className="flex gap-3 mb-4">
                <select
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  className="input flex-1 bg-white"
                >
                  <option value="">Select skills from catalog...</option>
                  {skillsCatalog?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <button type="button" onClick={() => addSkill(skillInput)} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-bold text-sm shadow-sm flex items-center gap-2">
                  <Plus size={16} /> Add
                </button>
              </div>
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  {form.requiredSkills.map(skill => (
                    <span key={skill} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-bold border border-indigo-200">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-600 bg-white/50 hover:bg-white rounded-full p-0.5 transition-colors"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">3. Budget & Timeline</h2>
          </div>
          <div className="p-8 space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-4">Hourly Budget Range (USD) <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.budgetMin}
                    onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))}
                    className="input pl-11 py-3 font-medium text-lg"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Min / hr</span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.budgetMax}
                    onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))}
                    className="input pl-11 py-3 font-medium text-lg"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Max / hr</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Timeline (weeks) <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
              <div className="relative max-w-sm">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="number"
                  min="1"
                  value={form.timelineWeeks}
                  onChange={e => setForm(f => ({ ...f, timelineWeeks: e.target.value }))}
                  className="input pl-11 py-3 font-medium text-lg"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Weeks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button type="submit" disabled={updateMutation.isPending || success} className="btn-primary py-4 px-10 text-lg flex-1 sm:flex-none justify-center shadow-md hover:shadow-lg">
            {updateMutation.isPending ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <><Save size={20} /> Save Changes</>
            )}
          </button>
          <Link href={`/projects/${pid}`} className="btn-secondary py-4 px-10 text-lg sm:ml-auto flex items-center justify-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
