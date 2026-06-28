import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { ArrowLeft, Save } from "lucide-react";
import { useGetProject, useUpdateProject, useListSkills } from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "../components/common/LoadingSpinner";

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

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!project) return <div className="text-center py-20 text-gray-500">Project not found</div>;
  if (user?.id !== project.clientId) {
    return <div className="text-center py-20 text-gray-500">You don't have permission to edit this project.</div>;
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href={`/projects/${pid}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm">
        <ArrowLeft size={16} /> Back to Project
      </Link>

      <div className="card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Project</h1>
        <p className="text-gray-500 mb-8 text-sm">Update your project details below.</p>

        {success && (
          <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
            Project updated successfully! Redirecting...
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Project Title *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="input"
              placeholder="e.g. Build a React E-commerce Dashboard"
              required
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input min-h-32"
              placeholder="Describe the project, goals, and what you're looking for..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input" required>
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Budget (USD) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.budgetMin}
                onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))}
                className="input"
                placeholder="e.g. 500"
                required
              />
            </div>
            <div>
              <label className="label">Max Budget (USD) *</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.budgetMax}
                onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))}
                className="input"
                placeholder="e.g. 2000"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Timeline (weeks) <span className="text-gray-400 font-normal">optional</span></label>
            <input
              type="number"
              min="1"
              value={form.timelineWeeks}
              onChange={e => setForm(f => ({ ...f, timelineWeeks: e.target.value }))}
              className="input"
              placeholder="e.g. 4"
            />
          </div>

          <div>
            <label className="label">Required Skills</label>
            <div className="flex gap-2 mb-2">
              <select
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                className="input flex-1"
              >
                <option value="">Select from catalog...</option>
                {skillsCatalog?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <button type="button" onClick={() => addSkill(skillInput)} className="btn-secondary px-4">Add</button>
            </div>
            {form.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.requiredSkills.map(skill => (
                  <span key={skill} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full border border-indigo-100">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 transition-colors text-indigo-400">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={updateMutation.isPending || success} className="btn-primary flex-1 justify-center">
              {updateMutation.isPending ? (
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
            <Link href={`/projects/${pid}`} className="btn-secondary px-6">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
