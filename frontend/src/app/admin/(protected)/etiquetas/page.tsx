import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminTags } from "@/lib/api/admin-client";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { deleteTagAction } from "./actions";

export const metadata: Metadata = {
  title: "Etiquetas",
  robots: "noindex,nofollow",
};

export default async function AdminTagsPage() {
  await requireAdminUser();
  const tags = await listAdminTags();
  const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <AdminPageHeader
        title="Etiquetas"
        description="Se crean automáticamente al escribirlas en un artículo — no hay un formulario de alta acá. Elimina las que ya no quieras que se sigan ofreciendo."
      />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay etiquetas" />
      ) : (
        <ul className="mt-6 flex flex-wrap gap-2">
          {sorted.map((tag) => (
            <li key={tag.id} className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-sm">
              <span className="text-foreground">{tag.name}</span>
              <form action={deleteTagAction.bind(null, tag.id)}>
                <button
                  type="submit"
                  aria-label={`Eliminar etiqueta ${tag.name}`}
                  className="text-muted hover:text-red-600 dark:hover:text-red-400"
                >
                  ×
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
