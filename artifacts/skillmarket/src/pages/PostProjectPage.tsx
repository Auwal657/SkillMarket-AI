import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, X, Briefcase, ArrowRight, DollarSign, Clock } from "lucide-react";
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
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to create project";
      setError(msg);
    }
  };

  return (
    <div className="page-container max-w-4xl animate-in">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-50">
          <Briefcase size={32} className="text-indigo-600" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">Post a New Project</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Describe what you need done and connect with top talent.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-6 py-4 flex items-center gap-3 shadow-sm">
            <span className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600"><X size={16} /></span>
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">1. Basic Details</h2>
            <p className="text-sm text-gray-500 mt-1">Give your project a clear title and specify the category.</p>
          </div>
          <div className="p-5 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Project Title <span className="text-red-500">*</span></label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input text-lg py-3" placeholder="e.g. Build a React dashboard for my startup" required />
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
          <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">2. Scope & Requirements</h2>
            <p className="text-sm text-gray-500 mt-1">Describe the work and the skills needed to complete it.</p>
          </div>
          <div className="p-5 sm:p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Project Description <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-500 mb-3">Provide clear expectations, deliverables, and any existing assets.</p>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input min-h-[200px] p-4 text-base" placeholder="Describe the project in detail..." required />
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <label className="block text-sm font-bold text-gray-900 mb-2">Required Skills</label>
              <p className="text-xs text-gray-500 mb-4">Adding specific skills helps AI match your project to the right freelancers.</p>
              
              <div className="flex gap-3 mb-4">
                <select value={skillInput} onChange={e => setSkillInput(e.target.value)} className="input flex-1 bg-white">
                  <option value="">Select skills from catalog...</option>
                  {skillsCatalog?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <button type="button" onClick={() => addSkill(skillInput)} className="px-6 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-bold text-sm shadow-sm flex items-center gap-2">
                  <Plus size={16} /> Add
                </button>
              </div>
              
              {form.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  {form.requiredSkills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-800 rounded-lg text-sm font-bold border border-indigo-200">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-600 bg-white/50 hover:bg-white rounded-full p-0.5 transition-colors"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900">3. Budget & Timeline</h2>
            <p className="text-sm text-gray-500 mt-1">Set expectations for compensation and delivery.</p>
          </div>
          <div className="p-5 sm:p-8 space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-4">Hourly Budget Range (USD) <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="number" min="1" step="1" value={form.budgetMin} onChange={e => setForm(f => ({ ...f, budgetMin: e.target.value }))} className="input pl-11 py-3 font-medium text-lg" placeholder="Min (e.g. 20)" required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Min / hr</span>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="number" min="1" step="1" value={form.budgetMax} onChange={e => setForm(f => ({ ...f, budgetMax: e.target.value }))} className="input pl-11 py-3 font-medium text-lg" placeholder="Max (e.g. 50)" required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Max / hr</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">Expected Timeline <span className="text-gray-400 font-normal ml-1">(Optional)</span></label>
              <div className="relative max-w-sm">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="number" min="1" value={form.timelineWeeks} onChange={e => setForm(f => ({ ...f, timelineWeeks: e.target.value }))} className="input pl-11 py-3 font-medium" placeholder="Duration in weeks" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Weeks</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
          <button type="submit" disabled={createMutation.isPending} className="btn-primary py-4 px-10 text-lg flex-1 sm:flex-none justify-center shadow-md hover:shadow-lg">
            {createMutation.isPending ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> : <><Briefcase size={20} /> Publish Project</>}
          </button>
          <button type="button" onClick={() => navigate("/dashboard")} className="btn-secondary py-4 px-10 text-lg sm:ml-auto">Cancel</button>
        </div>
      </form>
    </div>
  );
}
