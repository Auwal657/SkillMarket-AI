import { type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-20 px-4 text-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50", className)}>
      {Icon && (
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 text-gray-400">
          <Icon size={24} />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>}
      {action && (
        <button onClick={action.onClick} className="btn-secondary btn-sm text-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}
