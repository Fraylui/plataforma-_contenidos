import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FilterChipOption {
  label: string;
  href: string;
  active: boolean;
}

/**
 * Fila de chips de filtro deslizable (estilo app), en vez de menús
 * desplegables: cada chip es un enlace real (funciona sin JavaScript, lo
 * siguen los buscadores) y el activo lleva aria-current. Con una sola opción
 * no hay nada que elegir y no se muestra.
 */
export function FilterChips({ label, options, className }: { label: string; options: FilterChipOption[]; className?: string }) {
  if (options.length < 2) return null;
  return (
    <nav aria-label={label} className={cn("-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden", className)}>
      <ul className="flex w-max gap-2 py-1">
        {options.map((option) => (
          <li key={option.href}>
            <Link
              href={option.href}
              aria-current={option.active ? "page" : undefined}
              scroll={false}
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                option.active
                  ? "bg-foreground text-background"
                  : "bg-canvas-strong text-foreground hover:bg-border/60",
              )}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
