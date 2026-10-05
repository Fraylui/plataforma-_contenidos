import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { SkeletonImage } from "@/components/ui/skeleton-image";

const MAX_CATEGORIES = 4;
const TILES = 4;

function Tile({ item }: { item: HomeItem }) {
  return (
    <Link href={item.href} className="group flex min-w-0 flex-col gap-1.5">
      <span className="relative block aspect-square overflow-hidden rounded-lg bg-canvas-strong">
        {item.imageIsExternal ? (
          // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
          <img
            src={item.imageUrl ?? ""}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05] motion-reduce:transition-none"
          />
        ) : (
          <SkeletonImage
            src={item.imageUrl ?? ""}
            alt=""
            sizes="(min-width: 1024px) 140px, (min-width: 640px) 25vw, 45vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05] motion-reduce:transition-none"
          />
        )}
      </span>
      <span className="line-clamp-2 text-xs leading-snug font-medium text-foreground transition-colors group-hover:text-accent">
        {item.title}
      </span>
    </Link>
  );
}

/**
 * "Explora por tema": tarjetas de categoría con 4 portadas reales cada una
 * (las "quad cards" del home de Amazon). Muestra mucho contenido en poco
 * espacio y deja ver de qué va cada categoría antes de entrar — sin rotar
 * solas (a diferencia del carrusel "Categoría en foco" que se quitó).
 *
 * Usa solo lo que el home ya trajo (sin pedidos extra al backend) y solo
 * categorías con al menos 4 contenidos con imagen: una tarjeta a medio
 * llenar se ve rota, mejor no mostrarla.
 */
export function CategoryShowcase({ items, categories }: { items: HomeItem[]; categories: Category[] }) {
  const byCategory = new Map<string, HomeItem[]>();
  const seen = new Set<string>();
  for (const item of items) {
    if (!item.imageUrl || !item.categoryId || seen.has(item.id)) continue;
    seen.add(item.id);
    const list = byCategory.get(item.categoryId) ?? [];
    list.push(item);
    byCategory.set(item.categoryId, list);
  }

  const cards = categories
    .filter((c) => (byCategory.get(c.id)?.length ?? 0) >= TILES)
    .sort((a, b) => (byCategory.get(b.id)!.length - byCategory.get(a.id)!.length) || a.sortOrder - b.sortOrder)
    .slice(0, MAX_CATEGORIES);

  if (cards.length < 2) return null;

  // La grilla se adapta a cuántas categorías hay: con 4 columnas fijas, 2
  // tarjetas dejaban media fila vacía. Con 2, cada tarjeta ocupa la mitad y
  // sus 4 portadas van en una sola fila (más anchas, se aprovecha el espacio).
  const gridCols = { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" }[cards.length] ?? "lg:grid-cols-4";
  const tileCols = cards.length === 2 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2";

  return (
    <section aria-labelledby="explora-por-tema" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 id="explora-por-tema" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        Explora por tema
      </h2>
      <div className={`mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-2 ${gridCols}`}>
        {cards.map((category) => (
          <article
            key={category.id}
            className="flex flex-col rounded-2xl border border-foreground/[0.06] bg-surface p-4 shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)]"
          >
            <h3 className="text-base font-bold tracking-tight text-foreground">{category.name}</h3>
            <div className={`mt-3 grid gap-x-3 gap-y-3 ${tileCols}`}>
              {byCategory
                .get(category.id)!
                .slice(0, TILES)
                .map((item) => (
                  <Tile key={item.id} item={item} />
                ))}
            </div>
            <Link
              href={`/categorias/${category.slug}`}
              className="mt-4 inline-flex items-center gap-1 self-start text-[13px] font-semibold text-accent hover:underline"
            >
              Ver todo en {category.name}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
