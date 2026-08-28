import Link from "next/link";
import type { BusinessSummary } from "@/lib/api/types";
import { businessTypeLabel } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";

export function BusinessCard({ business }: { business: BusinessSummary }) {
  return (
    <Link
      href={`/directorio/${business.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md focus-visible:border-accent"
    >
      <div className="aspect-video">
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
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-medium tracking-wide text-accent uppercase">
          {businessTypeLabel(business.businessType)}
        </span>
        <h2 className="font-serif text-lg font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
          {business.name}
        </h2>
        {business.address && <p className="text-sm text-muted">{business.address}</p>}
        {business.excerpt && <p className="text-sm leading-relaxed text-muted line-clamp-2">{business.excerpt}</p>}
      </div>
    </Link>
  );
}
