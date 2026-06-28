import { cn } from "../../lib/utils";
import { X } from "lucide-react";

interface Props {
  name: string;
  proficiency?: string;
  onRemove?: () => void;
  variant?: "default" | "indigo" | "purple" | "green" | "outline";
}

const variants = {
  default: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/50 hover:bg-indigo-100",
  purple: "bg-purple-50 text-purple-700 ring-1 ring-purple-200/50 hover:bg-purple-100",
  green: "bg-green-50 text-green-700 ring-1 ring-green-200/50 hover:bg-green-100",
  outline: "bg-transparent border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50",
};

export default function SkillBadge({ name, proficiency, onRemove, variant = "outline" }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors", variants[variant])}>
      {name}
      {proficiency && <span className="opacity-60 text-[10px] uppercase tracking-wider">{proficiency}</span>}
      {onRemove && (
        <button 
          onClick={onRemove} 
          className="ml-0.5 -mr-1 p-0.5 rounded-sm opacity-60 hover:opacity-100 hover:bg-black/5 transition-all"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
