import { getInitials, cn } from "../../lib/utils";

interface Props {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base", xl: "w-20 h-20 text-xl" };

export default function Avatar({ name, avatarUrl, size = "md", className }: Props) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={cn("rounded-full object-cover", sizes[size], className)} />;
  }
  return (
    <div className={cn("rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold", sizes[size], className)}>
      {getInitials(name)}
    </div>
  );
}
