import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminBusinesses } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { parseAdminListParams } from "@/lib/admin/list-params";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { BusinessesTable } from "@/components/admin/businesses-table";

export const metadata: Metadata = {
  title: "Directorio",
  robots: "noindex,nofollow",
};

export default async function AdminDirectoryPage(props: PageProps<"/admin/directorio">) {
  const { user, accessToken } = await requireAdminUser();
  const params = parseAdminListParams(await props.searchParams);
  const result = await fetchOrAccessDenied(() => listAdminBusinesses(accessToken, params));
  if ("denied" in result) return <AccessDenied />;
  const isEmpty = result.data.totalElements === 0 && !params.q && !params.status;

  return (
    <div>
      <AdminPageHeader title="Directorio" action={{ href: "/admin/directorio/nuevo", label: "Nueva ficha" }} />

      {isEmpty ? (
        <EmptyState title="Todavía no hay fichas de directorio" description="Crea la primera para empezar." />
      ) : (
        <div className="mt-6">
          <BusinessesTable page={result.data} currentUser={user} />
        </div>
      )}
    </div>
  );
}
