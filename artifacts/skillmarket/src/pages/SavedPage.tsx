import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import ProjectCard from "../components/common/ProjectCard";
import FreelancerCard from "../components/common/FreelancerCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmptyState from "../components/common/EmptyState";
import { Link } from "wouter";

const BASE = "/api";

export default function SavedPage() {
  const { token } = useAuth();
  const [tab, setTab] = useState<"projects" | "freelancers">("projects");
  const [savedProjects, setSavedProjects] = useState<unknown[]>([]);
  const [savedFreelancers, setSavedFreelancers] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchSaved = async () => {
      const [pRes, fRes] = await Promise.all([
        fetch(`${BASE}/saved/projects`, { headers }),
        fetch(`${BASE}/saved/freelancers`, { headers }),
      ]);
      if (pRes.ok) setSavedProjects(await pRes.json());
      if (fRes.ok) setSavedFreelancers(await fRes.json());
      setLoading(false);
    };
    fetchSaved();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center"><Bookmark size={20} className="text-indigo-600" /></div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
      </div>

      <div className="flex gap-1 mb-8 p-1 bg-gray-100 rounded-xl w-fit">
        {(["projects", "freelancers"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "projects" ? `Projects (${savedProjects.length})` : `Freelancers (${savedFreelancers.length})`}
          </button>
        ))}
      </div>

      {tab === "projects" && (
        savedProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(savedProjects as Record<string, unknown>[]).map(p => (
              <ProjectCard key={p.id as number} id={p.id as number} title={p.title as string} description={p.description as string}
                category={p.category as string} budgetMin={p.budgetMin as number} budgetMax={p.budgetMax as number}
                timelineWeeks={p.timelineWeeks as number | null} status={p.status as string}
                clientName={p.clientName as string | null} requiredSkills={p.requiredSkills as string[]}
                applicationCount={p.applicationCount as number} createdAt={p.createdAt as string} />
            ))}
          </div>
        ) : (
          <EmptyState icon={Bookmark} title="No saved projects" description="Browse projects and save ones you're interested in." action={{ label: "Browse Projects", onClick: () => window.location.href = "/projects" }} />
        )
      )}

      {tab === "freelancers" && (
        savedFreelancers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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
          <EmptyState icon={Bookmark} title="No saved freelancers" description="Browse talent and save freelancers you'd like to work with." action={{ label: "Browse Talent", onClick: () => window.location.href = "/freelancers" }} />
        )
      )}
    </div>
  );
}
