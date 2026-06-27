import { useState } from "react";
import { Zap, Plus, Trash2 } from "lucide-react";
import { useListSkills, useListMySkills, useAddSkill, useRemoveSkill } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SkillBadge from "../../components/common/SkillBadge";

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export default function ManageSkillsPage() {
  const queryClient = useQueryClient();
  const { data: catalog, isLoading: catalogLoading } = useListSkills();
  const { data: mySkills, isLoading: skillsLoading } = useListMySkills();
  const addMutation = useAddSkill();
  const removeMutation = useRemoveSkill();

  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [proficiency, setProficiency] = useState<"beginner" | "intermediate" | "advanced" | "expert">("intermediate");
  const [error, setError] = useState("");

  const mySkillIds = new Set(mySkills?.map(s => s.skillId) ?? []);

  const availableSkills = catalog?.filter(s => !mySkillIds.has(s.id)) ?? [];

  const grouped = availableSkills.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, typeof catalog>);

  const handleAdd = async () => {
    if (!selectedSkillId) { setError("Please select a skill"); return; }
    setError("");
    try {
      await addMutation.mutateAsync({ data: { skillId: parseInt(selectedSkillId), proficiencyLevel: proficiency } });
      queryClient.invalidateQueries({ queryKey: ["/api/freelancers/me/skills"] });
      setSelectedSkillId("");
    } catch (err: unknown) {
      setError((err as { data?: { error?: string } })?.data?.error ?? "Failed to add skill");
    }
  };

  const handleRemove = async (skillId: number) => {
    try {
      await removeMutation.mutateAsync({ skillId });
      queryClient.invalidateQueries({ queryKey: ["/api/freelancers/me/skills"] });
    } catch {
      alert("Failed to remove skill");
    }
  };

  if (catalogLoading || skillsLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Zap size={20} className="text-indigo-600" /></div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Skills</h1>
        </div>
        <p className="text-gray-500">Add skills to get better AI-matched projects</p>
      </div>

      {/* Current Skills */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Your Skills ({mySkills?.length ?? 0})</h2>
        {mySkills && mySkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {mySkills.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                <span className="font-medium">{s.skillName}</span>
                <span className="text-indigo-400 text-xs">({s.proficiencyLevel})</span>
                <button onClick={() => handleRemove(s.skillId)} className="ml-1 text-indigo-400 hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No skills added yet. Add skills below to improve your AI match score.</p>
        )}
      </div>

      {/* Add Skill */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Add a Skill</h2>
        {error && <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}
        <div className="flex gap-3 mb-4">
          <select value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)} className="input flex-1">
            <option value="">Select a skill...</option>
            {Object.entries(grouped).map(([cat, skills]) => (
              <optgroup key={cat} label={cat}>
                {skills?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </optgroup>
            ))}
          </select>
          <select value={proficiency} onChange={e => setProficiency(e.target.value as typeof proficiency)} className="input sm:w-44">
            {PROFICIENCY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <button onClick={handleAdd} disabled={addMutation.isPending} className="btn-primary px-4">
            {addMutation.isPending ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Plus size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
