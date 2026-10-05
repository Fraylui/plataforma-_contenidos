import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Chrome base compartido por las tarjetas de contenido (Publicación, Lugar,
 * Evento, Galería, Directorio, resultado de búsqueda) — antes
 * repetido letra por letra en cada *-card.tsx. `className` ya no reemplaza
 * esto, solo agrega modificadores puntuales de una tarjeta específica.
 */
const CARD_CHROME =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-foreground/[0.06] bg-surface " +
  "shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)] " +
  "transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl " +
  "focus-visible:-translate-y-1 focus-visible:border-accent focus-visible:shadow-xl focus-visible:outline-none " +
  "active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100";

/**
 * Aparición suave + respuesta al tocar, solo con CSS (tailwindcss-animate).
 * Antes era Framer Motion con `whileInView`: cada tarjeta se renderizaba en
 * el servidor con opacidad 0 y recién JavaScript la mostraba al entrar en
 * pantalla — sin JS, o mientras hidrataba en un celular lento, el listado
 * se veía como un hueco vacío (encontrado en captura de /publicaciones).
 * La animación CSS corre aunque JS no haya cargado, respeta "reducir
 * movimiento" y además saca este componente del bundle del cliente.
 *
 * `itemClassName` va en el contenedor externo — el que es la celda de la
 * grilla. Todo lo de ubicación en la grilla (col-span) tiene que ir ahí: en
 * `className` (el enlace interno) no tiene efecto, y por eso la tarjeta
 * "destacada" de cada listado quedaba encajonada en una sola columna, con
 * la foto angosta y el título cortado.
 */
export function AnimatedCard({
  href,
  className,
  itemClassName,
  children,
}: {
  href: string;
  className?: string;
  itemClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "h-full motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500",
        itemClassName,
      )}
    >
      <Link href={href} className={cn(CARD_CHROME, className)}>
        {children}
      </Link>
    </div>
  );
}
