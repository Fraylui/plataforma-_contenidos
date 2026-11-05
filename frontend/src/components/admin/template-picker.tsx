import Link from "next/link";
import { Article, BookOpenText, ListNumbers, MapTrifold, Wrench } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { PUBLICATION_TEMPLATES, type TemplateKey } from "@/lib/admin/publication-templates";
import { cn } from "@/lib/utils";

const ICONS: Record<TemplateKey | "blanco", Icon> = {
  blanco: Article,
  lista: ListNumbers,
  guia: MapTrifold,
  tutorial: Wrench,
  historia: BookOpenText,
};

/**
 * «¿Cómo quieres empezar?» en Nueva publicación: en blanco o con una
 * plantilla que ya trae las secciones. La elección va en la URL
 * (?plantilla=lista), así el compositor arranca con ese texto.
 */
export function TemplatePicker({ selected }: { selected?: TemplateKey }) {
  const options = [
    { key: "blanco" as const, label: "En blanco", description: "Escribe libre, sin estructura.", href: "/admin/publicaciones/nuevo" },
    ...PUBLICATION_TEMPLATES.map((t) => ({ key: t.key, label: t.label, description: t.description, href: `/admin/publicaciones/nuevo?plantilla=${t.key}` })),
  ];
  const current = selected ?? "blanco";
  return (
    <nav aria-label="Cómo quieres empezar">
      <p className="mb-2 text-sm font-semibold text-foreground">¿Cómo quieres empezar?</p>
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
        {options.map((option) => {
          const OptionIcon = ICONS[option.key];
          const active = option.key === current;
          return (
            <li key={option.key} className="w-44 shrink-0 sm:w-auto">
              <Link
                href={option.href}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex h-full flex-col gap-1 rounded-card border p-3 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring",
                  active ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent/60",
                )}
              >
                <OptionIcon weight="duotone" className="size-6 text-accent" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">{option.label}</span>
                <span className="text-xs text-muted">{option.description}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
