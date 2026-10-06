import { listActiveCategories } from "@/lib/api/client";
import { SearchBox } from "@/components/layout/search-box";
import type { ShellBrand } from "./left-rail";
import { TopBarTitle } from "./top-bar-title";

/**
 * Franja superior, como el encabezado de X: a la izquierda el nombre de la
 * pantalla (con flecha para volver en los detalles), a la derecha el
 * buscador — en vez del buscador solo en medio de la franja, que se veía
 * vacío. Sin línea inferior: se funde con el fondo y se separa por el
 * desenfoque al hacer scroll.
 */
export async function TopBar({ brand }: { brand: ShellBrand }) {
  const categories = await listActiveCategories();
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1040px] items-center gap-4 px-4 lg:h-16 lg:px-6">
        <TopBarTitle brand={brand} />
        <div className="ml-auto flex items-center sm:hidden">
          <SearchBox variant="mobile" categoryNames={categoryNames} />
        </div>
        <div className="ml-auto hidden w-full max-w-md sm:block">
          <SearchBox variant="desktop" categoryNames={categoryNames} />
        </div>
      </div>
    </header>
  );
}
