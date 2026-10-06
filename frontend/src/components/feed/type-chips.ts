import type { FeedItemType } from "@/lib/api/types";
import type { FilterChipOption } from "./filter-chips";

const TYPES: { href: string; label: string; type: FeedItemType }[] = [
  { href: "/publicaciones", label: "Publicaciones", type: "ARTICLE" },
  { href: "/lugares", label: "Lugares", type: "PLACE" },
  { href: "/eventos", label: "Eventos", type: "EVENT" },
  { href: "/galerias", label: "Galerías", type: "GALLERY" },
  { href: "/directorio", label: "Directorio", type: "BUSINESS" },
];

/**
 * Chips de tipo del feed: "Todo" + solo los tipos con contenido publicado
 * (`visibility` = getPrimaryNavVisibility). Cada chip es la URL de la
 * sección, que ahora es el mismo feed filtrado (ver Task 9 del plan).
 */
export function typeChipOptions(visibility: Record<string, boolean>, activePath: string): FilterChipOption[] {
  return [
    { label: "Todo", href: "/", active: activePath === "/" },
    ...TYPES.filter((t) => visibility[t.href]).map((t) => ({ label: t.label, href: t.href, active: activePath === t.href })),
  ];
}

/** Chips de Explorar: mismos tipos, pero filtran la cuadrícula (`/explorar?tipo=`) en vez de ir a la sección. */
export function exploreChipOptions(visibility: Record<string, boolean>, activeType: FeedItemType | undefined): FilterChipOption[] {
  return [
    { label: "Todo", href: "/explorar", active: activeType === undefined },
    ...TYPES.filter((t) => visibility[t.href]).map((t) => ({
      label: t.label,
      href: `/explorar?tipo=${t.type}`,
      active: activeType === t.type,
    })),
  ];
}
