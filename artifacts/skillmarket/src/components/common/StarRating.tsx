import { Star } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  rating: number;
  maxStars?: number;
  size?: number;
  className?: string;
}

export default function StarRating({ rating, maxStars = 5, size = 16, className }: Props) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
        />
      ))}
    </div>
  );
}
