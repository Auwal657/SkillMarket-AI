import { cn } from "../../lib/utils";

interface Props { size?: "sm" | "md" | "lg"; className?: string; }
const sizes = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-[3px]", lg: "w-12 h-12 border-4" };

export default function LoadingSpinner({ size = "md", className }: Props) {
  return (
    <div className={cn("animate-spin rounded-full border-indigo-200 border-t-indigo-600", sizes[size], className)} />
  );
}
