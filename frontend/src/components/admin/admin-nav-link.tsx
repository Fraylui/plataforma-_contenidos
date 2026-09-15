"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

// `icon` llega ya renderizado (ReactNode), no como referencia a componente:
// un Server Component no puede pasar una función (el componente de ícono)
// a un Client Component — RSC solo serializa elementos ya renderizados.
export function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: ReactNode }) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive ? "text-accent" : "text-muted hover:text-foreground"
      }`}
    >
      {isActive && (
        // Un solo layoutId compartido entre todos los ítems: framer-motion anima
        // la posición/tamaño de este mismo elemento cuando el ítem activo cambia,
        // en vez de que el resaltado aparezca/desaparezca de golpe (queja: "se ve
        // estático"). Tween, no spring — el skill de diseño pide evitar rebote en
        // interfaces profesionales.
        <motion.span
          layoutId="admin-nav-active"
          className="absolute inset-0 rounded-md bg-accent-soft"
          transition={{ type: "tween", duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        />
      )}
      <span className="relative shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span className="relative truncate">{label}</span>
    </Link>
  );
}
