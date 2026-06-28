import { Link } from "wouter";
import { Star, MapPin, Bookmark, Briefcase } from "lucide-react";
import Avatar from "./Avatar";
import SkillBadge from "./SkillBadge";
import { formatCurrency, getAvailabilityColor, cn } from "../../lib/utils";

interface Skill { skillName: string; proficiencyLevel: string; }
interface FreelancerCardProps {
  id: number;
  name: string;
  headline: string;
  bio: string;
  hourlyRate: number;
  avatarUrl?: string | null;
  averageRating?: number | null;
  totalReviews?: number;
  completedProjects?: number;
  availabilityStatus?: string;
  university?: string | null;
  skills?: Skill[];
  matchScore?: number;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function FreelancerCard({ id, name, headline, bio, hourlyRate, avatarUrl, averageRating, totalReviews, completedProjects, availabilityStatus, university, skills = [], matchScore, onSave, isSaved }: FreelancerCardProps) {
  const isAvailable = availabilityStatus === 'available';

  return (
    <div className="card p-5 sm:p-6 flex flex-col h-full group relative overflow-hidden hover:border-indigo-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3 w-full">
          <Avatar 
            name={name} 
            avatarUrl={avatarUrl} 
            size="lg" 
            isOnline={isAvailable}
          />
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/freelancers/${id}`} className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate block text-lg">
                {name}
              </Link>
              {matchScore !== undefined && (
                <span className="badge bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 shrink-0">
                  {matchScore}% match
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-gray-600 truncate mt-0.5">{headline}</p>
            {university && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
                <MapPin size={12} />
                <span className="truncate">{university}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 flex-grow mb-5 leading-relaxed">{bio}</p>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {skills.slice(0, 4).map(s => <SkillBadge key={s.skillName} name={s.skillName} variant="outline" />)}
          {skills.length > 4 && <span className="text-xs text-gray-500 font-medium self-center">+{skills.length - 4}</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-3">
          <div className="font-semibold text-gray-900">
            {formatCurrency(hourlyRate)}<span className="text-sm font-normal text-gray-500">/hr</span>
          </div>
          
          {(averageRating || completedProjects) ? <div className="w-px h-4 bg-gray-200" /> : null}
          
          {averageRating ? (
            <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span>{averageRating.toFixed(1)}</span>
            </div>
          ) : completedProjects !== undefined && completedProjects > 0 ? (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Briefcase size={14} className="text-gray-400" />
              <span>{completedProjects} jobs</span>
            </div>
          ) : null}
        </div>
        
        {onSave && (
          <button 
            onClick={(e) => { e.preventDefault(); onSave(); }} 
            className={cn("p-2 rounded-md transition-colors relative z-10", 
              isSaved ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
          </button>
        )}
      </div>
      
      <Link href={`/freelancers/${id}`} className="absolute inset-0 z-0"><span className="sr-only">View profile</span></Link>
    </div>
  );
}
