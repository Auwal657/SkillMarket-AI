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
      {Array.from({ length: maxStars }).map((_, i) => {
        const isFilled = i < Math.round(rating);
        return (
          <Star
            key={i}
            size={size}
            className={cn(
              "transition-colors",
              isFilled ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-200"
            )}
          />
        );
      })}
    </div>
  );
}
