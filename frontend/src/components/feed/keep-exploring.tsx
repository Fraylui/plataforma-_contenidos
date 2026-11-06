import type { HomeItem } from "@/lib/home-items";
import { GridTile } from "@/components/post/grid-tile";

/** Filas completas de 3: un hueco al final se lee como abandono. */
const MAX = 6;

/**
 * «Mientras tanto, mira esto» (2026-10-21): una sección vacía (Series sin
 * programas, En vivo sin transmisión) no es un callejón sin salida; ofrece lo
 * más reciente para que la persona siga.
 */
export function KeepExploring({ items }: { items: HomeItem[] }) {
  const tiles = items.slice(0, items.length >= MAX ? MAX : items.length - (items.length % 3) || items.length);
  if (tiles.length === 0) return null;
  return (
    <section aria-labelledby="keep-exploring" className="mt-8">
      <h2 id="keep-exploring" className="mb-3 text-base font-bold text-foreground">
        Mientras tanto, mira esto
      </h2>
      <ul className="grid grid-cols-3 gap-0.5 overflow-hidden sm:gap-1 sm:rounded-card">
        {tiles.map((item) => (
          <li key={item.id}>
            <GridTile item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}
