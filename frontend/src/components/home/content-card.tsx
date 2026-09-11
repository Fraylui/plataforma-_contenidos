import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homeLikeType, type HomeItem } from "@/lib/home-items";
import { CardActions } from "@/components/content/card-actions";
import { NoImagePlaceholder } from "@/components/ui/no-image-placeholder";
import { SkeletonImage } from "@/components/ui/skeleton-image";
import { cn } from "@/lib/utils";

/**
 * Tarjeta = <article> con enlace "estirado" (el título lleva un ::after
 * que cubre toda la tarjeta) en vez de envolver todo en <Link>: así las
 * reacciones (botones) pueden vivir dentro sin anidar interactivos, que es
 * HTML inválido y rompe el teclado. Los botones van con z-10 para quedar
 * encima del ::after.
 */
const CHROME =
  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-canvas-border bg-surface shadow-sm " +
  "transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-[0_16px_32px_-16px_rgb(21_128_61_/_0.35),0_2px_6px_rgb(0_0_0_/_0.06)] " +
  "focus-within:border-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0";

const STRETCHED = "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none";

const TYPE_TAG =
  "absolute top-2 left-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold tracking-wider text-accent-foreground uppercase sm:top-2.5 sm:left-2.5 sm:py-1 sm:text-[11px]";

const KICKER = "text-[10px] font-semibold tracking-wider text-accent uppercase sm:text-[11px]";

function Cover({ item, sizes, className }: { item: HomeItem; sizes: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-canvas-strong", className)}>
      {item.imageUrl ? (
        <SkeletonImage
          src={item.imageUrl}
          alt={item.title}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          sizes={sizes}
        />
      ) : (
        <NoImagePlaceholder />
      )}
      <span className={TYPE_TAG}>{item.typeLabel}</span>
    </div>
  );
}

/**
 * Sin fecha de publicación a la vista (a pedido del usuario: la fecha queda
 * solo para el equipo, en el panel admin). La fecha sigue ordenando "Lo
 * nuevo" en el servidor y la de los eventos, que es de agenda, se muestra
 * en su propia sección.
 */
function Footer({ item }: { item: HomeItem }) {
  return (
    <div className="mt-auto flex items-center border-t border-canvas-border/70 pt-1 sm:pt-1.5">
      <CardActions contentType={homeLikeType(item.kind)} slug={item.slug} initialLikeCount={item.likeCount} title={item.title} path={item.href} />
    </div>
  );
}

/**
 * Tarjeta de contenido del home (diseño A, versión compacta): imagen 4:3
 * con etiqueta de tipo, categoría como antetítulo, título, resumen corto,
 * y pie con fecha + reacciones (Me gusta, Guardar, Compartir). Los 5 tipos
 * comparten la misma anatomía porque la portada los mezcla. En celular va
 * en rejilla de 2 columnas: un solo contenido nunca ocupa la pantalla.
 */
export function ContentCard({ item, categoryName }: { item: HomeItem; categoryName?: string }) {
  return (
    <article className={CHROME}>
      <Cover item={item} sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, 50vw" className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:p-3 sm:pb-2">
        {categoryName && <span className={KICKER}>{categoryName}</span>}
        <h3 className="text-[13px] font-semibold leading-snug tracking-tight text-foreground sm:text-sm">
          <Link href={item.href} className={cn(STRETCHED, "line-clamp-2 transition-colors group-hover:text-accent")}>
            {item.title}
          </Link>
        </h3>
        {item.excerpt && <p className="hidden text-xs leading-relaxed text-muted line-clamp-2 sm:block">{item.excerpt}</p>}
        <Footer item={item} />
      </div>
    </article>
  );
}

/**
 * Variante destacada de "Lo nuevo": horizontal (imagen a la izquierda) y
 * ocupa 2 columnas en escritorio; en celular es una tarjeta estándar más.
 */
export function FeaturedContentCard({ item, categoryName, cta }: { item: HomeItem; categoryName?: string; cta: string }) {
  return (
    <article className={cn(CHROME, "lg:col-span-2 lg:grid lg:grid-cols-[1.1fr_1fr]")}>
      <Cover item={item} sizes="(min-width: 1024px) 34vw, 50vw" className="aspect-[4/3] lg:aspect-auto lg:min-h-full" />
      <div className="flex flex-1 flex-col gap-1 p-2.5 sm:gap-1.5 sm:p-4">
        {categoryName && <span className={KICKER}>{categoryName}</span>}
        <h3 className="text-[13px] font-semibold leading-snug tracking-tight text-foreground sm:text-lg sm:font-bold">
          <Link href={item.href} className={cn(STRETCHED, "line-clamp-2 transition-colors group-hover:text-accent sm:line-clamp-3")}>
            {item.title}
          </Link>
        </h3>
        {item.excerpt && <p className="hidden text-[13px] leading-relaxed text-muted line-clamp-2 sm:block">{item.excerpt}</p>}
        <span className="hidden w-fit items-center gap-1.5 text-[13px] font-semibold text-accent sm:inline-flex">
          {cta}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
        <Footer item={item} />
      </div>
    </article>
  );
}
