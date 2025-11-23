import { CardPoster } from "./CardPoster";
import { Donghua } from "@/types";
import { SkeletonCard } from "./SkeletonCard";

interface RecommendationGridProps {
  items: Donghua[];
  title?: string;
  loading?: boolean;
}

export function RecommendationGrid({
  items,
  title = "Recommendations",
  loading,
}: RecommendationGridProps) {
  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (!items || items.length === 0) {
    return (
      <section className="container mx-auto px-4 py-8">
        {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
        <p className="text-muted-foreground">No recommendations available</p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item, index) => (
          <CardPoster key={item.id} item={item} index={index} />
        ))}
      </div>
    </section>
  );
}
