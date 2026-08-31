import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminGalleries } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { GalleriesTable } from "@/components/admin/galleries-table";

export const metadata: Metadata = {
  title: "Galerías",
  robots: "noindex,nofollow",
};

export default async function AdminGalleriesPage() {
  const { user, accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminGalleries(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Galerías" action={{ href: "/admin/galerias/nuevo", label: "Nueva galería" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay galerías" description="Crea la primera para empezar." />
      ) : (
        <div className="mt-6">
          <GalleriesTable galleries={sorted} currentUser={user} />
        </div>
      )}
    </div>
  );
}
