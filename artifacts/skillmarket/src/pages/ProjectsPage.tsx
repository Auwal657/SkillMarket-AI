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
    <div className="page-container">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-3">Browse Projects</h1>
        <p className="text-lg text-gray-600 max-w-2xl">Find your next opportunity and start building amazing things.</p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              value={q} 
              onChange={e => { setQ(e.target.value); setPage(0); }} 
              className="input pl-11 bg-gray-50 border-transparent focus:bg-white" 
              placeholder="Search projects..." 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              value={category} 
              onChange={e => { setCategory(e.target.value); setPage(0); }} 
              className="input bg-gray-50 border-transparent focus:bg-white sm:w-48"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={status} 
              onChange={e => { setStatus(e.target.value); setPage(0); }} 
              className="input bg-gray-50 border-transparent focus:bg-white sm:w-44"
            >
              <option value="">Any Status</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button
              onClick={() => setShowAdvanced(v => !v)}
              className={cn(
                "flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
                showAdvanced || hasAdvancedFilters
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              )}
            >
              <SlidersHorizontal size={16} />
              Filters
              {hasAdvancedFilters && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {(q || category || hasAdvancedFilters) && (
              <button 
                onClick={clearAll} 
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 whitespace-nowrap"
              >
                <X size={16} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="card p-6 mb-8 bg-gray-50/50 border-gray-200 animate-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="label">Min Budget ($/hr)</label>
              <input type="number" min="0" value={budgetMin} onChange={e => { setBudgetMin(e.target.value); setPage(0); }} placeholder="e.g. 10" className="input bg-white" />
            </div>
            <div>
              <label className="label">Max Budget ($/hr)</label>
              <input type="number" min="0" value={budgetMax} onChange={e => { setBudgetMax(e.target.value); setPage(0); }} placeholder="e.g. 100" className="input bg-white" />
            </div>
            <div>
              <label className="label">Required Skill</label>
              <select value={selectedSkill} onChange={e => { setSelectedSkill(e.target.value); setPage(0); }} className="input bg-white">
                <option value="">Any Skill</option>
                {SKILL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="label mb-3">Popular Skills</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.slice(0, 8).map(s => (
                <button 
                  key={s} 
                  onClick={() => { setSelectedSkill(selectedSkill === s ? "" : s); setPage(0); }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                    selectedSkill === s 
                      ? "bg-indigo-600 text-white shadow-md" 
                      : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>
      ) : projects && projects.length > 0 ? (
        <div className="animate-in">
          <div className="flex justify-between items-end mb-6">
            <p className="text-sm font-medium text-gray-500">
              Showing <span className="text-gray-900 font-semibold">{projects.length}</span> project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map(p => (
              <ProjectCard key={p.id} id={p.id} title={p.title} description={p.description} category={p.category}
                budgetMin={p.budgetMin} budgetMax={p.budgetMax} timelineWeeks={p.timelineWeeks} status={p.status}
                clientName={p.clientName} requiredSkills={p.requiredSkills} applicationCount={p.applicationCount} createdAt={p.createdAt} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-gray-100">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary">Previous</button>
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">Page {page + 1}</span>
            <button disabled={(projects?.length ?? 0) < limit} onClick={() => setPage(p => p + 1)} className="btn-secondary">Next</button>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={SlidersHorizontal} 
          title="No projects found" 
          description="We couldn't find any projects matching your current filters. Try broadening your search criteria." 
          action={{ label: "Clear Filters", onClick: clearAll }}
        />
      )}
    </div>
  );
}
