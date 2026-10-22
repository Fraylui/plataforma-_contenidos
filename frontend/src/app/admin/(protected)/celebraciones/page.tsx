import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminCelebrations } from "@/lib/api/admin/content";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { parseAdminListParams } from "@/lib/admin/list-params";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { CelebrationsTable } from "@/components/admin/celebrations-table";

export const metadata: Metadata = {
  title: "Celebraciones",
  robots: "noindex,nofollow",
};

export default async function AdminCelebrationsPage(props: PageProps<"/admin/celebraciones">) {
  const { user, accessToken } = await requireAdminUser();
  const params = parseAdminListParams(await props.searchParams);
  const result = await fetchOrAccessDenied(() => listAdminCelebrations(accessToken, params));
  if ("denied" in result) return <AccessDenied />;
  const isEmpty = result.data.totalElements === 0 && !params.q && !params.status;

  return (
    <div>
      <AdminPageHeader title="Celebraciones" action={{ href: "/admin/celebraciones/nuevo", label: "Nueva celebración" }} />

      {isEmpty ? (
        <EmptyState title="Todavía no hay celebraciones" description="Empieza por las que vuelven cada año: 28 de julio, Batalla de Ayacucho…" action={{ href: "/admin/celebraciones/nuevo", label: "Crear celebración" }} />
      ) : (
        <div className="mt-6">
          <CelebrationsTable page={result.data} currentUser={user} />
        </div>
      )}
    </div>
  );
}
