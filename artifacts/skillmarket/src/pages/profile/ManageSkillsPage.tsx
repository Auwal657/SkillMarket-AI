import { useState } from "react";
import { Zap, Plus, Trash2, Code2 } from "lucide-react";
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
    acc[s.category]!.push(s);
    return acc;
  }, {} as Record<string, { id: number; name: string; category: string }[]>);

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in">
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
              <Zap size={24} className="text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Skills</h1>
          </div>
          <p className="text-gray-500 sm:ml-15 mt-1">Add your best skills to get matched with high-paying projects.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Add Skill Form */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="card p-6 shadow-sm sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" /> Add a New Skill
            </h2>
            
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3 mb-6 shadow-sm">{error}</div>}
            
            <div className="space-y-5">
              <div>
                <label className="label">Select Skill</label>
                <select value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)} className="input w-full bg-gray-50/50 focus:bg-white text-base py-3">
                  <option value="">Choose a skill...</option>
                  {Object.entries(grouped).map(([cat, skills]) => (
                    <optgroup key={cat} label={cat} className="font-semibold text-gray-900">
                      {skills?.map(s => <option key={s.id} value={s.id} className="font-normal">{s.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Proficiency Level</label>
                <select value={proficiency} onChange={e => setProficiency(e.target.value as typeof proficiency)} className="input w-full bg-gray-50/50 focus:bg-white text-base py-3">
                  {PROFICIENCY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>

              <button 
                onClick={handleAdd} 
                disabled={addMutation.isPending || !selectedSkillId} 
                className="btn-primary w-full py-3 mt-2 shadow-md shadow-indigo-200/50"
              >
                {addMutation.isPending ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <span className="flex items-center justify-center gap-2 font-semibold">
                    <Plus size={18} /> Add to Profile
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Current Skills List */}
        <div className="lg:col-span-7 order-1 lg:order-2">
          <div className="card p-8 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Code2 size={20} className="text-gray-400" />
                Your Skillset
              </h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 font-medium rounded-full text-sm">
                {mySkills?.length ?? 0} skills
              </span>
            </div>

            {mySkills && mySkills.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {mySkills.map(s => (
                  <div 
                    key={s.id} 
                    className="group flex items-center gap-2 pl-4 pr-1 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-sm text-gray-800 rounded-full transition-all duration-200"
                  >
                    <span className="font-semibold text-sm">{s.skillName}</span>
                    <span className="text-gray-400 text-xs px-1.5 py-0.5 bg-gray-50 rounded-md capitalize">
                      {s.proficiencyLevel}
                    </span>
                    <button 
                      onClick={() => handleRemove(s.skillId)} 
                      className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors ml-1 focus:outline-none"
                      title="Remove skill"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <Zap size={28} className="text-gray-300" />
                </div>
                <p className="text-gray-900 font-medium mb-1">Your skillset is empty</p>
                <p className="text-gray-500 text-sm max-w-xs">Add skills from the menu to show clients what you can do.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
