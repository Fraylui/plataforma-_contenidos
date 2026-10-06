import Link from "next/link";
import { listActiveCategories } from "@/lib/api/client";
import { SearchBox } from "@/components/layout/search-box";
import type { ShellBrand } from "./left-rail";

/**
 * Franja superior mínima. Celular: marca + buscador desplegable. Escritorio:
 * solo el buscador (la marca y la navegación viven en el riel izquierdo),
 * como YouTube o LinkedIn — así el buscador con sugerencias y Ctrl+K está en
 * todas las páginas.
 */
export async function TopBar({ brand }: { brand: ShellBrand }) {
  const categories = await listActiveCategories();
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 lg:h-16 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 lg:hidden">
          {brand.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- logo definido en Configuración, host arbitrario
            <img src={brand.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          )}
          <span className="truncate text-base font-bold tracking-tight text-foreground">{brand.name}</span>
        </Link>
        <div className="ml-auto flex items-center sm:hidden">
          <SearchBox variant="mobile" categoryNames={categoryNames} />
        </div>
        <div className="hidden w-full max-w-2xl sm:mx-auto sm:block">
          <SearchBox variant="desktop" categoryNames={categoryNames} />
        </div>
      </div>
    </header>
  );
}
