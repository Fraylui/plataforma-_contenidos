import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminTags } from "@/lib/api/admin-client";
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
      <h1 className="font-serif text-2xl font-medium text-foreground">Etiquetas</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Las etiquetas se crean automáticamente al escribirlas en un artículo — no hay un formulario de alta acá.
        Elimina las que ya no quieras que se sigan ofreciendo.
      </p>

      {sorted.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Todavía no hay etiquetas.</p>
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
