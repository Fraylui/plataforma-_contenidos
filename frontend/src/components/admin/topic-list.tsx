import Link from "next/link";
import type { AdminCategory } from "@/lib/api/admin-types";
import { sortCategoriesHierarchically } from "@/lib/admin/category-tree";
import { Badge, type BadgeTone } from "@/components/ui";
import { AdminList, AdminListRow, ROW_ACTION_CLASS } from "@/components/admin/ui";

type ToggleAction = (id: string, active: boolean) => void | Promise<void>;

/**
 * Temas como lista (no tabla): en el celular no hay scroll lateral. Cada fila
 * dice cuánto publicado tiene el tema y si el visitante lo ve — un tema activo
 * sin contenido se oculta en el sitio y eso no se notaba desde el panel.
 */
export function TopicList({ topics, toggleAction }: { topics: AdminCategory[]; toggleAction: ToggleAction }) {
  return (
    <AdminList label="Temas">
      {sortCategoriesHierarchically(topics).map(({ category, depth }) => {
        const status = siteStatus(category);
        return (
          <AdminListRow
            key={category.id}
            indent={depth}
            title={
              <Link href={`/admin/temas/${category.id}`} className="hover:text-accent hover:underline">
                {category.name}
              </Link>
            }
            // El estado va con el conteo, bajo el nombre: así el nombre usa todo el ancho en el celular.
            meta={[
              <Badge key="status" tone={status.tone} dot>
                {status.label}
              </Badge>,
              publishedLabel(category.publishedCount),
            ]}
            actions={
              <form action={toggleAction.bind(null, category.id, !category.active)}>
                <button type="submit" className={ROW_ACTION_CLASS}>
                  {category.active ? "Desactivar" : "Activar"}
                </button>
              </form>
            }
          />
        );
      })}
    </AdminList>
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
