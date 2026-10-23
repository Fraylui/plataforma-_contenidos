"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

// `icon` llega ya renderizado (ReactNode), no como referencia a componente:
// un Server Component no puede pasar una función (el componente de ícono)
// a un Client Component — RSC solo serializa elementos ya renderizados. Por
// eso llegan las dos versiones: contorno y rellena para el activo (como
// Instagram).
export function AdminNavLink({
  href,
  label,
  icon,
  activeIcon,
  compact = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  activeIcon: ReactNode;
  /** Menú plegado: solo el ícono; el nombre queda para lectores de pantalla y como tooltip. */
  compact?: boolean;
  /** Al tocar (p. ej. cerrar el cajón del celular). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      title={compact ? label : undefined}
      onClick={onNavigate}
      className={`relative flex h-10 items-center gap-3 rounded-control text-sm transition-colors ${compact ? "justify-center px-0" : "px-3"} ${
        isActive ? "font-semibold text-foreground" : "font-medium text-muted hover:bg-field hover:text-foreground"
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
          className="absolute inset-0 rounded-control bg-accent-soft"
          transition={{ type: "tween", duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        />
      )}
      <span className={`relative shrink-0 [&>svg]:size-5 ${isActive ? "text-accent" : ""}`}>{isActive ? activeIcon : icon}</span>
      <span className={compact ? "sr-only" : "relative truncate"}>{label}</span>
    </Link>
  );
}
