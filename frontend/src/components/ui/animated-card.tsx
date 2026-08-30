"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Chrome base compartido por las 7 tarjetas de contenido (Artículo, Lugar,
 * Evento, Galería, Reseña, Directorio, resultado de búsqueda) — antes
 * repetido letra por letra en cada *-card.tsx. `className` ya no reemplaza
 * esto, solo agrega modificadores puntuales de una tarjeta específica.
 */
const CARD_CHROME =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm " +
  "transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl " +
  "focus-visible:-translate-y-1 focus-visible:border-accent focus-visible:shadow-xl focus-visible:outline-none";

/**
 * Envoltorio de animación: aparición suave al entrar en pantalla + tap
 * feedback con Framer Motion; la elevación al pasar el mouse ya la da
 * CARD_CHROME (hover:-translate-y-1), así que acá no se anima `y` en hover
 * para no duplicar el efecto con dos motores distintos (CSS + spring).
 */
export function AnimatedCard({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link href={href} className={cn(CARD_CHROME, className)}>
        {children}
      </Link>
    </motion.div>
  );
}
