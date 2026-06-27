import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Star, MapPin, DollarSign, Briefcase, Eye, MessageCircle, Bookmark, ExternalLink, Send } from "lucide-react";
import { useGetFreelancer } from "@workspace/api-client-react";
import { useAuth } from "../contexts/AuthContext";
import Avatar from "../components/common/Avatar";
import SkillBadge from "../components/common/SkillBadge";
import StarRating from "../components/common/StarRating";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { formatCurrency, getAvailabilityColor, cn } from "../lib/utils";

export default function FreelancerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const fid = parseInt(id, 10);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [savedMsg, setSavedMsg] = useState(false);

  const { data: freelancer, isLoading } = useGetFreelancer(fid, { query: { enabled: !!fid, queryKey: ["freelancer", fid] } });

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!freelancer) return <div className="text-center py-20 text-gray-500">Freelancer not found</div>;

  const name = freelancer.user?.name ?? "Freelancer";
  const skillsByCategory = (freelancer.skills ?? []).reduce((acc, s) => {
    const cat = s.skillCategory ?? "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, typeof freelancer.skills>);

  const handleContact = () => {
    if (!user) { navigate("/login"); return; }
    navigate(`/messages?recipient=${freelancer.userId}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/freelancers" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Freelancers
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <Avatar name={name} avatarUrl={freelancer.user?.avatarUrl} size="xl" className="mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-gray-500 text-sm mt-1">{freelancer.headline}</p>
            {freelancer.user?.university && (
              <div className="flex items-center justify-center gap-1 mt-2 text-xs text-gray-400">
                <MapPin size={12} /> {freelancer.user.university}
              </div>
            )}
            {freelancer.availabilityStatus && (
              <span className={cn("badge mt-3", getAvailabilityColor(freelancer.availabilityStatus))}>
                {freelancer.availabilityStatus}
              </span>
            )}

            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-100">
              <div className="text-center">
                <p className="font-bold text-gray-900">{formatCurrency(freelancer.hourlyRate)}</p>
                <p className="text-xs text-gray-400">per hour</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{freelancer.completedProjects ?? 0}</p>
                <p className="text-xs text-gray-400">projects</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-900">{freelancer.profileViews ?? 0}</p>
                <p className="text-xs text-gray-400">views</p>
              </div>
            </div>

            {freelancer.averageRating && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <StarRating rating={freelancer.averageRating} size={14} />
                <span className="text-sm font-medium text-gray-900">{freelancer.averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({freelancer.totalReviews ?? 0})</span>
              </div>
            )}

            <div className="mt-5 space-y-2">
              {user?.role === "client" && (
                <button onClick={handleContact} className="btn-primary w-full justify-center">
                  <MessageCircle size={16} /> Contact
                </button>
              )}
              <button onClick={() => setSavedMsg(true)} className={cn("w-full justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors", savedMsg ? "border-indigo-200 bg-indigo-50 text-indigo-600" : "border-gray-200 text-gray-600 hover:bg-gray-50")}>
                <Bookmark size={16} className={savedMsg ? "fill-current" : ""} />
                {savedMsg ? "Saved!" : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{freelancer.bio}</p>
          </div>

          {Object.entries(skillsByCategory).map(([category, catSkills]) => (
            <div key={category} className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">{category}</h2>
              <div className="flex flex-wrap gap-2">
                {catSkills?.map(s => <SkillBadge key={s.skillName} name={s.skillName} proficiency={s.proficiencyLevel} />)}
              </div>
            </div>
          ))}

          {freelancer.portfolio && freelancer.portfolio.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Portfolio</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {freelancer.portfolio.map(item => (
                  <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover" />}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {item.tags.map(t => <span key={t} className="badge bg-gray-100 text-gray-500">{t}</span>)}
                        </div>
                      )}
                      {item.projectUrl && (
                        <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                          <ExternalLink size={12} /> View Project
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
