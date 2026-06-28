import { useState, useEffect } from "react";
import { Bookmark, LayoutGrid, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ProjectCard from "../components/common/ProjectCard";
import FreelancerCard from "../components/common/FreelancerCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { cn } from "../lib/utils";

const BASE = "/api";

export default function SavedPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"projects" | "freelancers">("projects");
  const [savedProjects, setSavedProjects] = useState<unknown[]>([]);
  const [savedFreelancers, setSavedFreelancers] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchSaved = async () => {
      const [pRes, fRes] = await Promise.all([
        fetch(`${BASE}/saved/projects`, { credentials: "include" }),
        fetch(`${BASE}/saved/freelancers`, { credentials: "include" }),
      ]);
      if (pRes.ok) setSavedProjects(await pRes.json());
      if (fRes.ok) setSavedFreelancers(await fRes.json());
      setLoading(false);
    };
    fetchSaved();
  }, [user]);

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><LoadingSpinner size="xl" /></div>;

  return (
    <div className="page-container animate-in">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shadow-sm">
              <Bookmark size={24} className="text-indigo-600" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">Saved Items</h1>
          </div>
          <p className="text-lg text-gray-600">Access your bookmarked projects and talent easily.</p>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-xl shadow-sm self-start">
          <button 
            onClick={() => setTab("projects")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
              tab === "projects" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <LayoutGrid size={16} /> 
            Projects
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs ml-1",
              tab === "projects" ? "bg-indigo-100 text-indigo-800" : "bg-gray-200 text-gray-600"
            )}>{savedProjects.length}</span>
          </button>
          <button 
            onClick={() => setTab("freelancers")}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all",
              tab === "freelancers" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Users size={16} /> 
            Talent
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs ml-1",
              tab === "freelancers" ? "bg-indigo-100 text-indigo-800" : "bg-gray-200 text-gray-600"
            )}>{savedFreelancers.length}</span>
          </button>
        </div>
      </div>

      <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 md:p-8 min-h-[50vh]">
        {tab === "projects" && (
          savedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in">
              {(savedProjects as Record<string, unknown>[]).map(p => (
                <ProjectCard key={p.id as number} id={p.id as number} title={p.title as string} description={p.description as string}
                  category={p.category as string} budgetMin={p.budgetMin as number} budgetMax={p.budgetMax as number}
                  timelineWeeks={p.timelineWeeks as number | null} status={p.status as string}
                  clientName={p.clientName as string | null} requiredSkills={p.requiredSkills as string[]}
                  applicationCount={p.applicationCount as number} createdAt={p.createdAt as string} />
              ))}
            </div>
          ) : (
            <div className="animate-in pt-10">
              <EmptyState 
                icon={Bookmark} 
                title="No saved projects" 
                description="You haven't bookmarked any projects yet. Browse the marketplace and save ones you're interested in." 
                action={{ label: "Browse Projects", onClick: () => window.location.href = "/projects" }} 
              />
            </div>
          )
        )}

        {tab === "freelancers" && (
          savedFreelancers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in">
              {(savedFreelancers as Record<string, unknown>[]).map((f: Record<string, unknown>) => {
                const fUser = f.user as Record<string, unknown> | null;
                return (
                  <FreelancerCard key={f.id as number} id={f.id as number} name={fUser?.name as string ?? "Freelancer"}
                    headline={f.headline as string} bio={f.bio as string} hourlyRate={f.hourlyRate as number}
                    avatarUrl={fUser?.avatarUrl as string | null} averageRating={f.averageRating as number | null}
                    university={fUser?.university as string | null} skills={(f.skills ?? []) as Array<{ skillName: string; proficiencyLevel: string }>} />
                );
              })}
            </div>
          ) : (
            <div className="animate-in pt-10">
              <EmptyState 
                icon={Users} 
                title="No saved talent" 
                description="You haven't bookmarked any freelancers yet. Discover top talent and save profiles for future work." 
                action={{ label: "Browse Talent", onClick: () => window.location.href = "/freelancers" }} 
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
