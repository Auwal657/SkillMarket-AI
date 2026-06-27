import { Link } from "wouter";
import { Clock, DollarSign, Users, Bookmark } from "lucide-react";
import SkillBadge from "./SkillBadge";
import { formatCurrency, formatRelativeTime, getStatusColor, cn } from "../../lib/utils";

interface ProjectCardProps {
  id: number;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  timelineWeeks?: number | null;
  status: string;
  clientName?: string | null;
  requiredSkills?: string[];
  applicationCount?: number;
  createdAt: string | Date;
  onSave?: () => void;
  isSaved?: boolean;
}

export default function ProjectCard({ id, title, description, category, budgetMin, budgetMax, timelineWeeks, status, clientName, requiredSkills = [], applicationCount, createdAt, onSave, isSaved }: ProjectCardProps) {
  return (
    <div className="card p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge bg-indigo-100 text-indigo-700">{category}</span>
            <span className={cn("badge", getStatusColor(status))}>{status.replace("_", " ")}</span>
          </div>
          <Link href={`/projects/${id}`} className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2 block text-lg leading-snug">
            {title}
          </Link>
          {clientName && <p className="text-xs text-gray-400 mt-1">by {clientName}</p>}
        </div>
        {onSave && (
          <button onClick={onSave} className={cn("p-1.5 rounded-lg transition-colors flex-shrink-0", isSaved ? "text-indigo-600 bg-indigo-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100")}>
            <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-3">{description}</p>

      {requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {requiredSkills.slice(0, 5).map(s => <SkillBadge key={s} name={s} variant="purple" />)}
          {requiredSkills.length > 5 && <span className="badge bg-gray-100 text-gray-500">+{requiredSkills.length - 5}</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <DollarSign size={14} />
            <span>{formatCurrency(budgetMin)} – {formatCurrency(budgetMax)}</span>
          </div>
          {timelineWeeks && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{timelineWeeks}w</span>
            </div>
          )}
          {applicationCount !== undefined && (
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{applicationCount}</span>
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400">{formatRelativeTime(createdAt)}</span>
      </div>
    </div>
  );
}
