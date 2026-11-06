import Link from "next/link";
import { ArrowRight, Heart } from "@phosphor-icons/react/dist/ssr";
import type { HomeItem } from "@/lib/home-items";
import { CoverImage } from "./cover-image";

/** Tarjeta grande de un lugar en «Lugares de [región]»: foto amplia, nombre y su frase. */
export function RegionPlaceCard({ item, priority = false }: { item: HomeItem; priority?: boolean }) {
  return (
    <Link
      href={item.href}
      className="group block overflow-hidden rounded-card bg-surface shadow-card outline-none transition-shadow hover:shadow-pop focus-visible:ring-[3px] focus-visible:ring-ring"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-canvas-strong">
        <div className="absolute inset-0 transition-transform duration-500 motion-safe:group-hover:scale-105">
          <CoverImage item={item} sizes="(min-width: 640px) 360px, 100vw" priority={priority} />
        </div>
        {item.likeCount > 0 && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Heart weight="fill" className="size-3.5 text-like" aria-hidden="true" />
            <span className="tabular-nums">{item.likeCount}</span>
            <span className="sr-only">me gusta</span>
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="text-lg leading-snug font-extrabold text-foreground">{item.title}</h2>
          {item.excerpt && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{item.excerpt}</p>}
        </div>
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-fill text-accent-foreground transition-transform motion-safe:group-hover:translate-x-1"
        >
          <ArrowRight weight="bold" className="size-5" />
        </span>
      </div>
    </Link>
  );
}
