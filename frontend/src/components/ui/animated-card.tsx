"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Chrome base compartido por las 7 tarjetas de contenido (Artículo, Lugar,
 * Evento, Galería, Directorio, resultado de búsqueda) — antes
 * repetido letra por letra en cada *-card.tsx. `className` ya no reemplaza
 * esto, solo agrega modificadores puntuales de una tarjeta específica.
 */
const CARD_CHROME =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-foreground/[0.06] bg-surface " +
  "shadow-[0_1px_2px_rgb(0_0_0_/_0.04),0_8px_20px_-12px_rgb(0_0_0_/_0.08)] " +
  "transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl " +
  "focus-visible:-translate-y-1 focus-visible:border-accent focus-visible:shadow-xl focus-visible:outline-none";

/**
 * Envoltorio de animación: aparición suave al entrar en pantalla + tap
 * feedback con Framer Motion; la elevación al pasar el mouse ya la da
 * CARD_CHROME (hover:-translate-y-1), así que acá no se anima `y` en hover
 * para no duplicar el efecto con dos motores distintos (CSS + spring).
 */
export function AnimatedCard({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  // Framer Motion anima vía su propio motor (no CSS `transition`), así que
  // la regla global de prefers-reduced-motion en globals.css no la alcanza
  // — hay que apagarla acá a mano.
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      className="h-full"
    >
      <Link href={href} className={cn(CARD_CHROME, className)}>
        {children}
      </Link>
    </motion.div>
  );
}
