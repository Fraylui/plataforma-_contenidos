import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { HomeItem } from "@/lib/home-items";

/**
 * «También te puede interesar» a mitad de una publicación larga: el
 * «Más como esto» del final lo ve poca gente, y una página más por visita
 * es lo que más mueve las visitas y el ingreso por anuncios.
 */
export function InlineRelated({ item }: { item: HomeItem }) {
  return (
    <aside aria-label="También te puede interesar" className="not-prose my-8">
      <Link
        href={item.href}
        className="group flex items-center gap-3 rounded-card bg-accent-soft px-4 py-3 transition-colors hover:bg-accent-soft/70 focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium text-muted">También te puede interesar · {item.typeLabel}</span>
          <span className="mt-0.5 block font-bold leading-snug text-foreground group-hover:underline">{item.title}</span>
        </span>
        <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-accent" />
      </Link>
    </aside>
  );
}
