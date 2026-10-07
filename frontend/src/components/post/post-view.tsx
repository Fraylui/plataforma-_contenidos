import type { ReactNode } from "react";
import type { HomeItem } from "@/lib/home-items";
import { cn } from "@/lib/utils";
import { PostHeader, type PostBrand, type PostHeaderTime } from "./post-header";
import { GridTile } from "./grid-tile";

/**
 * Vista de un contenido como post de red social (diseño 2026-10-06), igual
 * para los 5 tipos:
 *  - "visual" (lugar, galería, evento, directorio): en escritorio, medio a la
 *    izquierda (fijo al hacer scroll) y texto a la derecha, como Instagram.
 *  - "text" (publicaciones, texto largo): una columna cómoda de leer con el
 *    medio arriba.
 * En celular: encabezado, medio a todo el ancho, acciones fijas abajo
 * (sobre la barra de pestañas) y el texto como pie. Sin ruta visible, sin
 * "min de lectura", sin antetítulo ni entradilla en negrita (eso era un
 * diario); la ruta sigue para Google en el JSON-LD de cada página.
 */
export function PostView({
  variant,
  brand,
  typeLabel,
  categoryName,
  time,
  title,
  media,
  excerpt,
  body,
  facts,
  actions,
  ad,
  more = [],
}: {
  variant: "visual" | "text";
  brand: PostBrand;
  typeLabel: string;
  categoryName?: string;
  time: PostHeaderTime | null;
  title: string;
  media: ReactNode;
  excerpt?: string | null;
  body?: ReactNode;
  facts?: ReactNode;
  actions: ReactNode;
  ad?: ReactNode;
  more?: HomeItem[];
}) {
  const visual = variant === "visual";
  const header = <PostHeader brand={brand} typeLabel={typeLabel} categoryName={categoryName} time={time} className="flex items-center gap-3 px-4 py-3 sm:px-0" />;
  const text = (
    <>
      <h1 className="px-4 text-2xl leading-tight font-extrabold tracking-tight text-balance text-foreground sm:px-0 sm:text-3xl">{title}</h1>
      {facts && <div className="mt-4 px-4 sm:px-0">{facts}</div>}
      {excerpt && <p className="mt-4 px-4 text-base leading-relaxed text-foreground sm:px-0">{excerpt}</p>}
      {body && <div className="mt-4 px-4 sm:px-0">{body}</div>}
      <section
        aria-label="Acciones"
        className="sticky bottom-(--bottom-bar-h) z-20 mt-4 bg-canvas/95 px-4 backdrop-blur-md sm:px-0 lg:static lg:bg-transparent lg:backdrop-blur-none"
      >
        {actions}
      </section>
      {ad && <div className="mt-6 px-4 sm:px-0">{ad}</div>}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-[1040px] pb-8 sm:px-4 sm:pt-4">
      {/* Un solo encabezado en el DOM: en escritorio (variante visual) la
          grilla lo ubica a la derecha, arriba del texto, y el medio ocupa la
          columna izquierda en las dos filas. */}
      <article
        className={cn(
          visual
            ? "lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10"
            : "mx-auto max-w-[680px]",
        )}
      >
        <div className={cn(visual && "lg:col-start-2 lg:row-start-1")}>{header}</div>
        <div className={cn("pb-2", visual && "lg:sticky lg:top-20 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:pb-0")}>{media}</div>
        <div className={cn("min-w-0 pt-1", visual && "lg:col-start-2 lg:row-start-2")}>{text}</div>
      </article>

      {more.length > 0 && (
        <section aria-label="Más como esto" className="mt-10">
          <h2 className="px-4 text-base font-bold text-foreground sm:px-0">Más como esto</h2>
          <ul className="mt-3 grid grid-cols-3 gap-0.5 sm:gap-1">
            {more.map((item) => (
              <li key={item.id}>
                <GridTile item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
