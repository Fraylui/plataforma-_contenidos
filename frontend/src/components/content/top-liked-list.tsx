import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TopLikedEntry {
  id: string;
  href: string;
  title: string;
  likeCount: number;
}

/**
 * "Lo más gustado": títulos numerados con su cantidad REAL de me gusta (ver
 * FeedController.getTopLiked — nunca relleno). Lista de texto sin fotos, la
 * "Historias principales" de MSN. La usan el feed del home (como una
 * tarjeta más de la grilla) y la columna lateral del detalle.
 */
export function TopLikedList({ items, className }: { items: TopLikedEntry[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-label="Lo más gustado" className={cn("flex flex-col", className)}>
      <h2 className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground">
        <Heart className="h-4 w-4 fill-accent text-accent" aria-hidden="true" />
        Lo más gustado
      </h2>
      <ol className="mt-2 flex flex-col divide-y divide-foreground/[0.06]">
        {items.slice(0, 5).map((item, index) => (
          <li key={item.id}>
            <Link href={item.href} className="group flex min-h-11 items-start gap-3 py-2.5">
              <span className="w-5 shrink-0 text-lg leading-none font-bold text-accent tabular-nums">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[13px] leading-snug font-semibold text-foreground transition-colors group-hover:text-accent">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted tabular-nums">
                  {item.likeCount.toLocaleString("es")} me gusta
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
