import { getInitials, cn } from "../../lib/utils";

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isOnline?: boolean;
}

const sizes = { 
  sm: "w-8 h-8 text-xs", 
  md: "w-10 h-10 text-sm", 
  lg: "w-14 h-14 text-base", 
  xl: "w-20 h-20 text-xl" 
};

export default function Avatar({ name, avatarUrl, size = "md", className, isOnline }: Props) {
  return (
    <div className="relative inline-block group">
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={name} 
          className={cn("rounded-full object-cover shadow-sm ring-1 ring-black/5 group-hover:ring-black/10 transition-shadow", sizes[size], className)} 
        />
      ) : (
        <div className={cn("rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-700 font-medium shadow-sm ring-1 ring-black/5 group-hover:ring-black/10 transition-shadow", sizes[size], className)}>
          {getInitials(name)}
        </div>
      )}
      {isOnline !== undefined && (
        <span className={cn(
          "absolute bottom-0 right-0 block rounded-full ring-2 ring-white",
          isOnline ? "bg-green-500" : "bg-gray-300",
          size === "sm" ? "w-2 h-2" : size === "md" ? "w-2.5 h-2.5" : "w-3 h-3"
        )} />
      )}
    </div>
  );
}
