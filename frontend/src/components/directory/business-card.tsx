import { AnimatedCard } from "@/components/ui/animated-card";
import { CardMedia } from "@/components/ui/card-media";
import type { BusinessSummary } from "@/lib/api/types";
import { businessTypeLabel } from "@/lib/content-labels";

export function BusinessCard({ business }: { business: BusinessSummary }) {
  return (
    <AnimatedCard href={`/directorio/${business.slug}`}>
      <CardMedia
        imageId={business.coverImageId}
        alt={business.name}
        badge={businessTypeLabel(business.businessType)}
      />

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {business.name}
        </h2>
        {business.address && <p className="text-sm text-muted">{business.address}</p>}
        {business.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{business.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}
