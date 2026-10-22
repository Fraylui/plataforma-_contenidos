import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminGalleries } from "@/lib/api/admin/content";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { parseAdminListParams } from "@/lib/admin/list-params";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { GalleriesTable } from "@/components/admin/galleries-table";

export const metadata: Metadata = {
  title: "Galerías",
  robots: "noindex,nofollow",
};

export default async function AdminGalleriesPage(props: PageProps<"/admin/galerias">) {
  const { user, accessToken } = await requireAdminUser();
  const params = parseAdminListParams(await props.searchParams);
  const result = await fetchOrAccessDenied(() => listAdminGalleries(accessToken, params));
  if ("denied" in result) return <AccessDenied />;
  const isEmpty = result.data.totalElements === 0 && !params.q && !params.status;

  return (
    <div>
      <AdminPageHeader title="Galerías" action={{ href: "/admin/galerias/nuevo", label: "Nueva galería" }} />

      {isEmpty ? (
        <EmptyState title="Todavía no hay galerías" description="Crea la primera para empezar." action={{ href: "/admin/galerias/nuevo", label: "Crear galería" }} />
      ) : (
        <div className="mt-6">
          <GalleriesTable page={result.data} currentUser={user} />
        </div>
      )}
    </div>
  );
}
