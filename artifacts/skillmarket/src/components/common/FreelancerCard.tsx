import { Link } from "wouter";
import { Star, MapPin, Bookmark } from "lucide-react";
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
  return (
    <div className="card p-6 flex flex-col gap-4 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Avatar name={name} avatarUrl={avatarUrl} size="lg" />
          <div className="min-w-0">
            <Link href={`/freelancers/${id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1 block">{name}</Link>
            <p className="text-sm text-gray-500 line-clamp-1">{headline}</p>
            {university && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">{university}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {matchScore !== undefined && (
            <span className="badge bg-indigo-100 text-indigo-700 font-semibold">{matchScore}% match</span>
          )}
          {onSave && (
            <button onClick={onSave} className={cn("p-1.5 rounded-lg transition-colors", isSaved ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}>
              <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-600 line-clamp-2">{bio}</p>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map(s => <SkillBadge key={s.skillName} name={s.skillName} />)}
          {skills.length > 4 && <span className="badge bg-gray-100 text-gray-500">+{skills.length - 4}</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-4 text-sm">
          {averageRating ? (
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span className="font-medium text-gray-900">{averageRating.toFixed(1)}</span>
              <span className="text-gray-400">({totalReviews})</span>
            </div>
          ) : null}
          {completedProjects !== undefined && completedProjects > 0 && (
            <span className="text-gray-500">{completedProjects} projects</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {availabilityStatus && (
            <span className={cn("badge", getAvailabilityColor(availabilityStatus))}>{availabilityStatus}</span>
          )}
          <span className="font-bold text-gray-900">{formatCurrency(hourlyRate)}<span className="text-sm font-normal text-gray-500">/hr</span></span>
        </div>
      </div>
    </div>
  );
}
