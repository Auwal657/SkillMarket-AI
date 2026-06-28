import { useState } from "react";
import { useSearch } from "wouter";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";
import ProjectCard from "../components/common/ProjectCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { cn } from "../lib/utils";

const CATEGORIES = ["Frontend", "Backend", "Mobile", "Design", "Data Science", "Writing", "Marketing", "Video", "Other"];
const STATUSES = [{ value: "open", label: "Open" }, { value: "in_progress", label: "In Progress" }, { value: "completed", label: "Completed" }];
const SKILL_OPTIONS = ["React", "TypeScript", "Node.js", "Python", "Flutter", "Figma", "Machine Learning", "Vue", "Angular", "GraphQL", "PostgreSQL", "AWS"];

export default function ProjectsPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [q, setQ] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [status, setStatus] = useState("open");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 12;

  const { data: projects, isLoading } = useListProjects({
    search: q || undefined,
    category: category || undefined,
    status: status || undefined,
    budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
    budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
    skills: selectedSkill || undefined,
    limit,
    offset: page * limit,
  });

  const hasAdvancedFilters = !!(budgetMin || budgetMax || selectedSkill);

  const clearAll = () => {
    setQ(""); setCategory(""); setBudgetMin(""); setBudgetMax(""); setSelectedSkill(""); setPage(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Projects</h1>
        <p className="text-gray-500">Find your next opportunity</p>
      </div>

      {/* Search + Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} className="input pl-11" placeholder="Search projects..." />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(0); }} className="input sm:w-44">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(0); }} className="input sm:w-40">
          <option value="">Any Status</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm border rounded-xl transition-colors",
            showAdvanced || hasAdvancedFilters
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-gray-200 text-gray-500 hover:bg-gray-50"
          )}
        >
          <SlidersHorizontal size={14} />
          Filters
          {hasAdvancedFilters && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
        {(q || category || hasAdvancedFilters) && (
          <button onClick={clearAll} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="card p-5 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label text-xs">Min Budget ($/hr)</label>
            <input type="number" min="0" value={budgetMin} onChange={e => { setBudgetMin(e.target.value); setPage(0); }} placeholder="e.g. 10" className="input" />
          </div>
          <div>
            <label className="label text-xs">Max Budget ($/hr)</label>
            <input type="number" min="0" value={budgetMax} onChange={e => { setBudgetMax(e.target.value); setPage(0); }} placeholder="e.g. 100" className="input" />
          </div>
          <div>
            <label className="label text-xs">Required Skill</label>
            <select value={selectedSkill} onChange={e => { setSelectedSkill(e.target.value); setPage(0); }} className="input">
              <option value="">Any Skill</option>
              {SKILL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Skill quick-pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SKILL_OPTIONS.slice(0, 8).map(s => (
          <button key={s} onClick={() => { setSelectedSkill(selectedSkill === s ? "" : s); setPage(0); }}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
              selectedSkill === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : projects && projects.length > 0 ? (
        <>
          <p className="text-sm text-gray-400 mb-4">{projects.length} result{projects.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {projects.map(p => (
              <ProjectCard key={p.id} id={p.id} title={p.title} description={p.description} category={p.category}
                budgetMin={p.budgetMin} budgetMax={p.budgetMax} timelineWeeks={p.timelineWeeks} status={p.status}
                clientName={p.clientName} requiredSkills={p.requiredSkills} applicationCount={p.applicationCount} createdAt={p.createdAt} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-10">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span className="text-sm text-gray-500">Page {page + 1}</span>
            <button disabled={(projects?.length ?? 0) < limit} onClick={() => setPage(p => p + 1)} className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </>
      ) : (
        <EmptyState icon={SlidersHorizontal} title="No projects found" description="Try adjusting your filters or search query." />
      )}
    </div>
  );
}
