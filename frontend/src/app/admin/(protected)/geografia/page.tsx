import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminGeography } from "@/lib/api/admin-client";
import { sortGeographyHierarchically } from "@/lib/admin/geography-tree";
import { geographyLevelLabel } from "@/lib/content-labels";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, StatusPill } from "@/components/admin/ui";
import { setGeographyActiveAction } from "./actions";

export const metadata: Metadata = {
  title: "Geografía",
  robots: "noindex,nofollow",
};

export default async function AdminGeographyPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminGeography(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const rows = sortGeographyHierarchically(result.data);

  return (
    <div>
      <AdminPageHeader title="Geografía" action={{ href: "/admin/geografia/nueva", label: "Nueva unidad" }} />

      {rows.length === 0 ? (
        <EmptyState title="Todavía no hay unidades geográficas" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Nivel</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ unit, depth }) => (
                <tr key={unit.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-4 py-3">
                    <span style={{ paddingLeft: `${depth * 1.25}rem` }} className="inline-block">
                      <Link href={`/admin/geografia/${unit.id}`} className="font-medium text-foreground hover:text-accent">
                        {unit.name}
                      </Link>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{geographyLevelLabel(unit.level)}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={unit.active ? "success" : "neutral"} label={unit.active ? "Activa" : "Inactiva"} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={setGeographyActiveAction.bind(null, unit.id, !unit.active)}>
                      <button type="submit" className="text-xs font-medium text-muted underline underline-offset-2 hover:text-accent">
                        {unit.active ? "Desactivar" : "Activar"}
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
