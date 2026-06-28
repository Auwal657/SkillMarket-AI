import { useState } from "react";
import { useSearch } from "wouter";
import { Search, Users, X, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { useListFreelancers } from "@workspace/api-client-react";
import FreelancerCard from "../components/common/FreelancerCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { cn } from "../lib/utils";

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
  const [rateMin, setRateMin] = useState("");
  const [rateMax, setRateMax] = useState("");
  const [page, setPage] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const limit = 12;

  const { data: allFreelancers, isLoading } = useListFreelancers({ search: q || undefined, skill: skill || undefined, limit: 100, offset: 0 });

  const freelancers = (allFreelancers ?? []).filter(f => {
    if (availability && f.availabilityStatus !== availability) return false;
    if (rateMin && f.hourlyRate < parseFloat(rateMin)) return false;
    if (rateMax && f.hourlyRate > parseFloat(rateMax)) return false;
    return true;
  }).slice(page * limit, (page + 1) * limit);

  const totalFiltered = (allFreelancers ?? []).filter(f => {
    if (availability && f.availabilityStatus !== availability) return false;
    if (rateMin && f.hourlyRate < parseFloat(rateMin)) return false;
    if (rateMax && f.hourlyRate > parseFloat(rateMax)) return false;
    return true;
  }).length;

  const hasMore = (page + 1) * limit < totalFiltered;
  const hasAdvancedFilters = !!(rateMin || rateMax || availability);
  const hasFilters = q || skill || availability || rateMin || rateMax;

  const clearFilters = () => { setQ(""); setSkill(""); setAvailability(""); setRateMin(""); setRateMax(""); setPage(0); };

  return (
    <div className="page-container">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-3">Find Talent</h1>
        <p className="text-lg text-gray-600 max-w-2xl">Browse top-tier verified freelancers ready to bring your ideas to life.</p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              value={q} 
              onChange={e => { setQ(e.target.value); setPage(0); }} 
              className="input pl-11 bg-gray-50 border-transparent focus:bg-white" 
              placeholder="Search by name, skill, or keywords..." 
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <select 
              value={skill} 
              onChange={e => { setSkill(e.target.value); setPage(0); }} 
              className="input bg-gray-50 border-transparent focus:bg-white sm:w-56"
            >
              <option value="">All Skills</option>
              {SKILL_FILTERS.map(s => <option key={s} value={s}>{s}</option>)}
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
              More Filters
              {hasAdvancedFilters && <span className="w-2 h-2 bg-indigo-600 rounded-full" />}
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {hasFilters && (
              <button 
                onClick={clearFilters} 
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="label mb-3">Hourly Rate Range ($/hr)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  min="0" 
                  value={rateMin} 
                  onChange={e => { setRateMin(e.target.value); setPage(0); }}
                  placeholder="Min" 
                  className="input bg-white" 
                />
                <span className="text-gray-400 font-medium">to</span>
                <input 
                  type="number" 
                  min="0" 
                  value={rateMax} 
                  onChange={e => { setRateMax(e.target.value); setPage(0); }}
                  placeholder="Max" 
                  className="input bg-white" 
                />
              </div>
            </div>
            <div>
              <label className="label mb-3">Availability Status</label>
              <select 
                value={availability} 
                onChange={e => { setAvailability(e.target.value); setPage(0); }} 
                className="input bg-white"
              >
                {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Popular Skills</h3>
        <div className="flex flex-wrap gap-2">
          {SKILL_FILTERS.map(s => (
            <button 
              key={s} 
              onClick={() => { setSkill(skill === s ? "" : s); setPage(0); }}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                skill === s 
                  ? "bg-indigo-600 text-white shadow-md" 
                  : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-32"><LoadingSpinner size="lg" /></div>
      ) : freelancers.length > 0 ? (
        <div className="animate-in">
          <div className="flex justify-between items-end mb-6">
            <p className="text-sm font-medium text-gray-500">
              Showing <span className="text-gray-900 font-semibold">{totalFiltered}</span> freelancer{totalFiltered !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {freelancers.map(f => (
              <FreelancerCard key={f.id} id={f.id} name={f.user?.name ?? "Freelancer"} headline={f.headline}
                bio={f.bio} hourlyRate={f.hourlyRate} avatarUrl={f.user?.avatarUrl} averageRating={f.averageRating}
                totalReviews={f.totalReviews} completedProjects={f.completedProjects} availabilityStatus={f.availabilityStatus}
                university={f.user?.university} skills={f.skills} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-12 pt-8 border-t border-gray-100">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary">Previous</button>
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">Page {page + 1} of {Math.ceil(totalFiltered / limit) || 1}</span>
            <button disabled={!hasMore} onClick={() => setPage(p => p + 1)} className="btn-secondary">Next</button>
          </div>
        </div>
      ) : (
        <EmptyState 
          icon={Users} 
          title="No talent found" 
          description="We couldn't find any freelancers matching your current criteria. Try adjusting your filters." 
          action={{ label: "Clear Filters", onClick: clearFilters }}
        />
      )}
    </div>
  );
}
