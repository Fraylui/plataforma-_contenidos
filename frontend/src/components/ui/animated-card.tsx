"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Envoltorio compartido por las 7 tarjetas de contenido (Artículo, Lugar,
 * Evento, Galería, Reseña, Directorio, resultado de búsqueda): aparición
 * suave al entrar en pantalla + elevación real con física de resorte al
 * pasar el mouse, con Framer Motion en vez de solo transiciones CSS.
 */
export function AnimatedCard({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Link href={href} className={`h-full ${className}`}>
        {children}
      </Link>
    </motion.div>
  );
}
