import Link from "next/link";
import { BookOpen, Building2, CalendarDays, Images, MapPin, type LucideIcon } from "lucide-react";

export interface ModuleCount {
  href: string;
  label: string;
  count: number;
  /** "publicadas", "próximos"… — qué está contando el número. */
  unit: string;
}

const ICONS: Record<string, LucideIcon> = {
  "/publicaciones": BookOpen,
  "/lugares": MapPin,
  "/eventos": CalendarDays,
  "/galerias": Images,
  "/directorio": Building2,
};

/**
 * Franja de módulos con cantidades reales bajo el hero — el equivalente de
 * la franja "Envío gratis · Entrega rápida" de AliExpress: una sola línea
 * delgada que dice de un vistazo todo lo que hay en el sitio y lleva directo
 * a cada sección. Solo módulos con contenido (count > 0) y siempre números
 * reales del backend, nunca redondeos tipo "+1000".
 */
export function ModuleStrip({ modules }: { modules: ModuleCount[] }) {
  const visible = modules.filter((m) => m.count > 0);
  if (visible.length < 2) return null;

  return (
    <nav aria-label="Secciones del sitio" className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <ul className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5 [&::-webkit-scrollbar]:hidden">
        {visible.map(({ href, label, count, unit }) => {
          const Icon = ICONS[href] ?? BookOpen;
          return (
            <li key={href} className="shrink-0 snap-start">
              <Link
                href={href}
                className="group flex h-full items-center gap-3 rounded-xl border border-foreground/[0.06] bg-surface px-3.5 py-3 shadow-[0_1px_2px_rgb(0_0_0_/_0.04)] transition-colors hover:border-accent/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold whitespace-nowrap text-foreground">{label}</span>
                  <span className="text-xs whitespace-nowrap text-muted tabular-nums">
                    {count.toLocaleString("es")} {unit}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
