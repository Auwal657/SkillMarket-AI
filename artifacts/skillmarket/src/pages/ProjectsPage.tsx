import { useState } from "react";
import { useSearch } from "wouter";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useListProjects } from "@workspace/api-client-react";
import ProjectCard from "../components/common/ProjectCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

const CATEGORIES = ["Frontend", "Backend", "Mobile", "Design", "Data Science", "Writing", "Marketing", "Video", "Other"];
const STATUSES = [{ value: "open", label: "Open" }, { value: "in_progress", label: "In Progress" }, { value: "completed", label: "Completed" }];

export default function ProjectsPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [q, setQ] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [status, setStatus] = useState("open");
  const [page, setPage] = useState(0);
  const limit = 12;

  const { data: projects, isLoading } = useListProjects({ search: q || undefined, category: category || undefined, status: status || undefined, limit, offset: page * limit });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Projects</h1>
        <p className="text-gray-500">Find your next opportunity from {projects?.length ?? 0}+ projects</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
        {(q || category) && (
          <button onClick={() => { setQ(""); setCategory(""); setPage(0); }} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : projects && projects.length > 0 ? (
        <>
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
