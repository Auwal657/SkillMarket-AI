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
    <div className="card p-5 sm:p-6 flex flex-col h-full group relative overflow-hidden">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{category}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span className={cn("text-xs font-medium capitalize", 
              status === 'open' ? 'text-green-600' : 'text-gray-500'
            )}>{status.replace("_", " ")}</span>
          </div>
          <Link href={`/projects/${id}`} className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 block text-lg">
            {title}
          </Link>
          {clientName && <p className="text-sm text-gray-500">by <span className="font-medium text-gray-700">{clientName}</span></p>}
        </div>
        {onSave && (
          <button 
            onClick={(e) => { e.preventDefault(); onSave(); }} 
            className={cn("p-2 rounded-md transition-colors flex-shrink-0 -mt-1 -mr-1", 
              isSaved ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Bookmark size={18} className={isSaved ? "fill-current" : ""} />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 line-clamp-2 flex-grow mb-5 leading-relaxed">{description}</p>

      {requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {requiredSkills.slice(0, 4).map(s => <SkillBadge key={s} name={s} variant="outline" />)}
          {requiredSkills.length > 4 && <span className="text-xs text-gray-500 font-medium self-center">+{requiredSkills.length - 4}</span>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-y-3 gap-x-4 pt-4 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
          <DollarSign size={16} className="text-gray-400" />
          <span>{formatCurrency(budgetMin)} – {formatCurrency(budgetMax)}</span>
        </div>
        
        {timelineWeeks && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} className="text-gray-400" />
            <span>{timelineWeeks} weeks</span>
          </div>
        )}
        
        {applicationCount !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} className="text-gray-400" />
            <span>{applicationCount} proposals</span>
          </div>
        )}
        
        <div className="text-sm text-gray-500 text-right col-start-2">
          {formatRelativeTime(createdAt)}
        </div>
      </div>
      
      <Link href={`/projects/${id}`} className="absolute inset-0 z-0"><span className="sr-only">View project</span></Link>
    </div>
  );
}
