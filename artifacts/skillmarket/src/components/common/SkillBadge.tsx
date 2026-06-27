import { cn } from "../../lib/utils";

interface Props {
  name: string;
  proficiency?: string;
  onRemove?: () => void;
  variant?: "default" | "indigo" | "purple" | "green";
}

const variants = {
  default: "bg-gray-100 text-gray-700",
  indigo: "bg-indigo-100 text-indigo-700",
  purple: "bg-purple-100 text-purple-700",
  green: "bg-green-100 text-green-700",
};

export default function SkillBadge({ name, proficiency, onRemove, variant = "indigo" }: Props) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium", variants[variant])}>
      {name}
      {proficiency && <span className="opacity-60 text-xs">({proficiency})</span>}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 hover:opacity-70 transition-opacity">×</button>
      )}
    </span>
  );
}
