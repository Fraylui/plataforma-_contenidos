import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminSeries } from "@/lib/api/admin/series";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { parseAdminListParams } from "@/lib/admin/list-params";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { SeriesTable } from "@/components/admin/series-table";

export const metadata: Metadata = {
  title: "Series",
  robots: "noindex,nofollow",
};

export default async function AdminSeriesPage(props: PageProps<"/admin/series">) {
  const { user, accessToken } = await requireAdminUser();
  const params = parseAdminListParams(await props.searchParams);
  const result = await fetchOrAccessDenied(() => listAdminSeries(accessToken, params));
  if ("denied" in result) return <AccessDenied />;
  const isEmpty = result.data.totalElements === 0 && !params.q && !params.status;

  return (
    <div>
      <AdminPageHeader
        title="Series"
        description="Programas que se transmiten en YouTube. Conecta una lista de reproducción y sus videos llegan solos al sitio."
        action={{ href: "/admin/series/nueva", label: "Nueva serie" }}
      />

      {isEmpty ? (
        <EmptyState
          title="Todavía no hay series"
          description="Pega el link de una lista de reproducción de YouTube para crear la primera."
          action={{ href: "/admin/series/nueva", label: "Crear serie" }}
        />
      ) : (
        <div className="mt-6">
          <SeriesTable page={result.data} currentUser={user} />
        </div>
      )}
    </div>
  );
}
