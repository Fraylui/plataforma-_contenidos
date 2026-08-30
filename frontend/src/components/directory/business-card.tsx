import { AnimatedCard } from "@/components/ui/animated-card";
import type { BusinessSummary } from "@/lib/api/types";
import { businessTypeLabel } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";

export function BusinessCard({ business }: { business: BusinessSummary }) {
  return (
    <AnimatedCard
      href={`/directorio/${business.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-200 hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="relative aspect-video">
        {business.coverImageId ? (
          // eslint-disable-next-line @next/next/no-img-element -- host propio del backend
          <img
            src={imageUrl(`/api/v1/images/${business.coverImageId}/file`)}
            alt={business.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <NoImagePlaceholder />
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, transparent 100%)" }}
        />
        <span className="absolute inset-x-0 bottom-0 h-1 bg-accent" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium tracking-wide text-accent uppercase">
          {businessTypeLabel(business.businessType)}
        </span>
        <h2 className="text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
          {business.name}
        </h2>
        {business.address && <p className="text-sm text-muted">{business.address}</p>}
        {business.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{business.excerpt}</p>}
      </div>
    </AnimatedCard>
  );
}
