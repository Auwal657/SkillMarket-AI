import { useState } from "react";
import { useSearch } from "wouter";
import { Search, Users, X } from "lucide-react";
import { useListFreelancers } from "@workspace/api-client-react";
import FreelancerCard from "../components/common/FreelancerCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";

const SKILL_FILTERS = ["React", "TypeScript", "Node.js", "Python", "UI / UX Design", "Figma", "Machine Learning", "Flutter", "Copywriting", "SEO"];
const AVAILABILITY_OPTIONS = [
  { value: "", label: "Any Availability" },
  { value: "available", label: "Available Now" },
  { value: "part-time", label: "Part-time" },
  { value: "busy", label: "Busy" },
];

export default function FreelancersPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [q, setQ] = useState(params.get("search") ?? "");
  const [skill, setSkill] = useState(params.get("skill") ?? "");
  const [availability, setAvailability] = useState(params.get("availability") ?? "");
  const [page, setPage] = useState(0);
  const limit = 12;

  const { data: allFreelancers, isLoading } = useListFreelancers({ search: q || undefined, skill: skill || undefined, limit: 100, offset: 0 });

  const freelancers = (allFreelancers ?? []).filter(f => {
    if (!availability) return true;
    return f.availabilityStatus === availability;
  }).slice(page * limit, (page + 1) * limit);

  const totalFiltered = (allFreelancers ?? []).filter(f => {
    if (!availability) return true;
    return f.availabilityStatus === availability;
  }).length;

  const hasMore = (page + 1) * limit < totalFiltered;

  const clearFilters = () => { setQ(""); setSkill(""); setAvailability(""); setPage(0); };
  const hasFilters = q || skill || availability;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Talent</h1>
        <p className="text-gray-500">Browse verified freelancers ready to work</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={q} onChange={e => { setQ(e.target.value); setPage(0); }} className="input pl-11" placeholder="Search by name, skill, bio..." />
        </div>
        <select value={skill} onChange={e => { setSkill(e.target.value); setPage(0); }} className="input sm:w-52">
          <option value="">All Skills</option>
          {SKILL_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={availability} onChange={e => { setAvailability(e.target.value); setPage(0); }} className="input sm:w-48">
          {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Skill quick-filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {SKILL_FILTERS.map(s => (
          <button key={s} onClick={() => { setSkill(skill === s ? "" : s); setPage(0); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${skill === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : freelancers.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-4">{totalFiltered} freelancer{totalFiltered !== 1 ? "s" : ""} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {freelancers.map(f => (
              <FreelancerCard key={f.id} id={f.id} name={f.user?.name ?? "Freelancer"} headline={f.headline}
                bio={f.bio} hourlyRate={f.hourlyRate} avatarUrl={f.user?.avatarUrl} averageRating={f.averageRating}
                totalReviews={f.totalReviews} completedProjects={f.completedProjects} availabilityStatus={f.availabilityStatus}
                university={f.user?.university} skills={f.skills} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-10">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            <span className="text-sm text-gray-500">Page {page + 1} of {Math.ceil(totalFiltered / limit) || 1}</span>
            <button disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </>
      ) : (
        <EmptyState icon={Users} title="No freelancers found" description="Try adjusting your search or filters." />
      )}
    </div>
  );
}
