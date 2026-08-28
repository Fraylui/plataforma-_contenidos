import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminBusinesses } from "@/lib/api/admin-client";
import { articleStatusLabel, articleStatusTone, businessTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, ListCard, StatusPill } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Directorio",
  robots: "noindex,nofollow",
};

export default async function AdminDirectoryPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminBusinesses(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Directorio" action={{ href: "/admin/directorio/nuevo", label: "Nueva ficha" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay fichas de directorio" description="Crea la primera para empezar." />
      ) : (
        <div className="mt-6 space-y-2">
          {sorted.map((business) => (
            <ListCard
              key={business.id}
              href={`/admin/directorio/${business.id}`}
              title={business.name}
              meta={`${businessTypeLabel(business.businessType)} · ${formatPublishedDate(business.createdAt)}`}
              pill={<StatusPill tone={articleStatusTone(business.status)} label={articleStatusLabel(business.status)} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
