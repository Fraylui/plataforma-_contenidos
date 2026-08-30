import { Search } from "lucide-react";

/**
 * Búsqueda para mobile: a diferencia de la primera versión (ícono que
 * abría un panel flotante aparte, con doble borde y navegación a otra
 * página), esto es un único input que YA es del tamaño del ícono en
 * reposo (sin borde visible, se ve como un botón) y se expande en el
 * mismo lugar al enfocarlo — el ícono nunca desaparece, se desliza hacia
 * la izquierda del campo en vez de quedar centrado. Todo con CSS
 * (:focus/peer-focus), sin JS ni estado — no hay panel que pueda quedar
 * mal posicionado.
 */
export function MobileSearch() {
  return (
    <form action="/buscar" role="search" className="relative sm:hidden">
      <label htmlFor="mobile-search" className="sr-only">
        Buscar contenido
      </label>
      <input
        id="mobile-search"
        type="search"
        name="q"
        placeholder="Buscar…"
        className="peer h-11 w-11 rounded-md border border-transparent bg-transparent py-2 pr-3 pl-11 text-sm text-background outline-none transition-[width,background-color,border-color,color] duration-200 focus:w-48 focus:border-border focus:bg-background focus:pl-9 focus:text-foreground"
      />
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-background transition-[left,transform,color] duration-200 peer-focus:left-3 peer-focus:translate-x-0 peer-focus:text-foreground"
      />
    </form>
  );
}
