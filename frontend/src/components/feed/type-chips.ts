import type { FilterChipOption } from "./filter-chips";

const TYPES: { href: string; label: string }[] = [
  { href: "/publicaciones", label: "Publicaciones" },
  { href: "/lugares", label: "Lugares" },
  { href: "/eventos", label: "Eventos" },
  { href: "/galerias", label: "Galerías" },
  { href: "/directorio", label: "Directorio" },
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
