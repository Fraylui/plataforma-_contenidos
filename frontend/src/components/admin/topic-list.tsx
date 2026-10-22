import Link from "next/link";
import type { AdminCategory } from "@/lib/api/admin-types";
import { sortCategoriesHierarchically } from "@/lib/admin/category-tree";
import { Badge, type BadgeTone } from "@/components/ui";

type ToggleAction = (id: string, active: boolean) => void | Promise<void>;

/**
 * Temas como lista (no tabla): en el celular no hay scroll lateral. Cada fila
 * dice cuánto publicado tiene el tema y si el visitante lo ve — un tema activo
 * sin contenido se oculta en el sitio y eso no se notaba desde el panel.
 */
export function TopicList({ topics, toggleAction }: { topics: AdminCategory[]; toggleAction: ToggleAction }) {
  return (
    <ul className="mt-6 divide-y divide-border overflow-hidden rounded-card bg-surface shadow-card">
      {sortCategoriesHierarchically(topics).map(({ category, depth }) => {
        const status = siteStatus(category);
        return (
          <li key={category.id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft/40">
            <div className="min-w-0 flex-1" style={{ paddingLeft: `${Math.min(depth, 4) * 1.25}rem` }}>
              <Link
                href={`/admin/temas/${category.id}`}
                className="font-medium [overflow-wrap:anywhere] text-foreground hover:text-accent hover:underline"
              >
                {category.name}
              </Link>
              <p className="mt-0.5 text-xs tabular-nums text-muted">{publishedLabel(category.publishedCount)}</p>
            </div>
            <Badge tone={status.tone} dot className="shrink-0">
              {status.label}
            </Badge>
            <form action={toggleAction.bind(null, category.id, !category.active)} className="shrink-0">
              <button
                type="submit"
                className="min-h-11 cursor-pointer px-1 text-xs font-medium text-muted underline underline-offset-2 hover:text-accent"
              >
                {category.active ? "Desactivar" : "Activar"}
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}

function siteStatus(category: AdminCategory): { label: string; tone: BadgeTone } {
  if (!category.active) return { label: "Inactivo", tone: "neutral" };
  if (category.visibleOnSite) return { label: "En el sitio", tone: "success" };
  return { label: "No se ve en el sitio", tone: "warning" };
}

function publishedLabel(count: number): string {
  if (count === 0) return "Sin contenido publicado";
  return count === 1 ? "1 publicado" : `${count} publicados`;
}
