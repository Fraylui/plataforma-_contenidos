import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeItem } from "@/lib/home-items";
import { homeLikeType } from "@/lib/content-kind";
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
/**
 * Borde en baja opacidad sobre el color de texto (no un tono fijo tipo
 * --canvas-border): así se funde con la tarjeta blanca en vez de dibujar un
 * rectángulo verdoso alrededor de cada una — con decenas de tarjetas en
 * grilla, un borde de color sólido se nota como una cuadrícula dura. La
 * sombra es la que da la separación real contra el lienzo verde.
 */
const CHROME =
  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-foreground/[0.06] bg-surface shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)] " +
  "transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_16px_32px_-16px_rgb(21_128_61_/_0.3),0_2px_6px_rgb(0_0_0_/_0.06)] " +
  "focus-within:border-accent motion-reduce:transition-none motion-reduce:hover:translate-y-0";

const STRETCHED = "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none";

/**
 * Solo la categoría bajo la imagen — sin el tipo de contenido al lado
 * ("Artículo"/"Lugar"/...). El tipo es un dato real que el equipo necesita
 * para publicar, pero de cara al visitante no ayuda a decidir qué mirar
 * (a pedido explícito: "para los que trabajan debe estar, pero al mostrar
 * hace ruido"), ni siquiera acá donde el feed mezcla tipos.
 */
const KICKER = "text-[10px] font-semibold tracking-wider text-accent uppercase sm:text-[11px]";

const COVER_TRANSFORM =
  "object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100";

function Cover({ item, sizes, className }: { item: HomeItem; sizes: string; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden bg-canvas-strong", className)}>
      {!item.imageUrl ? (
        <NoImagePlaceholder />
      ) : item.imageIsExternal ? (
        // eslint-disable-next-line @next/next/no-img-element -- enlace externo pegado por quien redacta, host arbitrario
        <img src={item.imageUrl} alt={item.title} className={cn("absolute inset-0 h-full w-full", COVER_TRANSFORM)} />
      ) : (
        <SkeletonImage src={item.imageUrl} alt={item.title} className={COVER_TRANSFORM} sizes={sizes} />
      )}
    </div>
  );
}

function Kicker({ categoryName }: { categoryName?: string }) {
  if (!categoryName) return null;
  return <span className={KICKER}>{categoryName}</span>;
}

/**
 * Sin fecha de publicación a la vista (a pedido del usuario: la fecha queda
 * solo para el equipo, en el panel admin). La fecha sigue ordenando "Lo
 * nuevo" en el servidor y la de los eventos, que es de agenda, se muestra
 * en su propia sección.
 */
function Footer({ item }: { item: HomeItem }) {
  return (
    <div className="mt-auto flex items-center border-t border-foreground/[0.06] pt-0.5 sm:pt-1">
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
      <Cover item={item} sizes="(min-width: 1024px) 24vw, (min-width: 640px) 33vw, 50vw" className="aspect-[16/10]" />
      <div className="flex flex-1 flex-col gap-1 p-2.5 pb-1.5 sm:px-3 sm:pt-2.5">
        <Kicker categoryName={categoryName} />
        <h3 className="min-h-[2.5rem] text-[13px] leading-5 font-bold tracking-tight text-foreground sm:text-[15px]">
          <Link href={item.href} className={cn(STRETCHED, "line-clamp-2 transition-colors group-hover:text-accent")}>
            {item.title}
          </Link>
        </h3>
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
      <Cover item={item} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 33vw, 50vw" className="aspect-[16/10] lg:aspect-auto lg:min-h-full" />
      <div className="flex flex-1 flex-col gap-1 p-2.5 pb-1.5 sm:gap-1.5 sm:p-4 sm:pb-2">
        <Kicker categoryName={categoryName} />
        <h3 className="min-h-[2.5rem] text-[13px] leading-5 font-semibold tracking-tight text-foreground sm:min-h-0 sm:text-lg sm:leading-snug sm:font-bold">
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
