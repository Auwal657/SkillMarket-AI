import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, X, Briefcase } from "lucide-react";
import { useCreateProject, useListSkills } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function PostProjectPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: skillsCatalog } = useListSkills();
  const createMutation = useCreateProject();

  const [form, setForm] = useState({
    title: "", description: "", category: "", budgetMin: "", budgetMax: "", timelineWeeks: "", requiredSkills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState("");

  const CATEGORIES = ["Frontend", "Backend", "Mobile", "Design", "Data Science", "Writing", "Marketing", "Video", "Other"];

  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (s && !form.requiredSkills.includes(s)) {
      setForm(f => ({ ...f, requiredSkills: [...f.requiredSkills, s] }));
    }
    setSkillInput("");
  };

  const removeSkill = (skill: string) => setForm(f => ({ ...f, requiredSkills: f.requiredSkills.filter(s => s !== skill) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const budgetMin = parseFloat(form.budgetMin);
    const budgetMax = parseFloat(form.budgetMax);
    if (isNaN(budgetMin) || isNaN(budgetMax)) { setError("Enter valid budget values"); return; }
    if (budgetMin > budgetMax) { setError("Min budget must be ≤ max budget"); return; }
    try {
      await createMutation.mutateAsync({
        data: {
          title: form.title, description: form.description, category: form.category,
          budgetMin, budgetMax,
          timelineWeeks: form.timelineWeeks ? parseInt(form.timelineWeeks) : undefined,
          requiredSkills: form.requiredSkills.length > 0 ? form.requiredSkills : undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/my"] });
      navigate("/my-projects");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to create project";
      setError(msg);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Post a Project</h1>
        </div>
        <p className="text-gray-500">Describe your project and find the perfect freelancer</p>
      </div>

      <div className="card p-8">
        {error && <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Project Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Build a React dashboard for my startup" required />
          </div>

          <div>
            <label className="label">Category *</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="input" required>
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Project Description *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input min-h-40" placeholder="Describe the project in detail — what do you need built, what problem does it solve, any existing systems to integrate with..." required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Min Budget (USD) *</label>
              <input type="number" min="1" step="1" value={form.budgetMin} onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))} className="input" placeholder="500" required />
            </div>
            <div>
              <label className="label">Max Budget (USD) *</label>
              <input type="number" min="1" step="1" value={form.budgetMax} onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))} className="input" placeholder="2000" required />
            </div>
          </div>

          <div>
            <label className="label">Timeline (weeks) <span className="text-gray-400 font-normal">optional</span></label>
            <input type="number" min="1" value={form.timelineWeeks} onChange={e => setForm(f => ({ ...f, timelineWeeks: e.target.value }))} className="input" placeholder="e.g. 4" />
          </div>

          <div>
            <label className="label">Required Skills</label>
            <div className="flex gap-2 mb-3">
              <select value={skillInput} onChange={e => setSkillInput(e.target.value)} className="input flex-1">
                <option value="">Select from catalog...</option>
                {skillsCatalog?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <button type="button" onClick={() => addSkill(skillInput)} className="px-4 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors font-medium text-sm">
                <Plus size={16} />
              </button>
            </div>
            {form.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.requiredSkills.map(s => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    {s}
                    <button type="button" onClick={() => removeSkill(s)} className="hover:opacity-70"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-2">Adding skills helps AI match your project to the right freelancers.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 justify-center py-3.5">
              {createMutation.isPending ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <><Briefcase size={16} /> Post Project</>}
            </button>
            <button type="button" onClick={() => navigate("/dashboard/client")} className="btn-secondary px-6">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
