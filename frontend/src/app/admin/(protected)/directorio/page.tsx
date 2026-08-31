import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminBusinesses } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { BusinessesTable } from "@/components/admin/businesses-table";

export const metadata: Metadata = {
  title: "Directorio",
  robots: "noindex,nofollow",
};

export default async function AdminDirectoryPage() {
  const { user, accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminBusinesses(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Directorio" action={{ href: "/admin/directorio/nuevo", label: "Nueva ficha" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay fichas de directorio" description="Crea la primera para empezar." />
      ) : (
        <div className="mt-6">
          <BusinessesTable businesses={sorted} currentUser={user} />
        </div>
      )}
    </div>
  );
}
