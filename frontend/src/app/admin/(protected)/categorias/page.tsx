import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminCategories } from "@/lib/api/admin-client";
import { sortCategoriesHierarchically } from "@/lib/admin/category-tree";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, StatusPill } from "@/components/admin/ui";
import { setCategoryActiveAction } from "./actions";

export const metadata: Metadata = {
  title: "Categorías",
  robots: "noindex,nofollow",
};

export default async function AdminCategoriesPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminCategories(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const rows = sortCategoriesHierarchically(result.data);

  return (
    <div>
      <AdminPageHeader title="Categorías" action={{ href: "/admin/categorias/nueva", label: "Nueva categoría" }} />

      {rows.length === 0 ? (
        <EmptyState title="Todavía no hay categorías" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category, depth }) => (
                <tr key={category.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-4 py-3">
                    <span style={{ paddingLeft: `${depth * 1.25}rem` }} className="inline-block">
                      <Link href={`/admin/categorias/${category.id}`} className="font-medium text-foreground hover:text-accent">
                        {category.name}
                      </Link>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={category.active ? "success" : "neutral"} label={category.active ? "Activa" : "Inactiva"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={setCategoryActiveAction.bind(null, category.id, !category.active)}>
                      <button type="submit" className="text-xs font-medium text-muted underline underline-offset-2 hover:text-accent">
                        {category.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
