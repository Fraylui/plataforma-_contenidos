import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminPlaces } from "@/lib/api/admin-client";
import { articleStatusLabel, articleStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, ListCard, StatusPill } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Lugares",
  robots: "noindex,nofollow",
};

export default async function AdminPlacesPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminPlaces(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Lugares" action={{ href: "/admin/lugares/nuevo", label: "Nuevo lugar" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay lugares" description="Crea el primero para empezar." />
      ) : (
        <div className="mt-6 space-y-2">
          {sorted.map((place) => (
            <ListCard
              key={place.id}
              href={`/admin/lugares/${place.id}`}
              title={place.name}
              meta={formatPublishedDate(place.createdAt)}
              pill={<StatusPill tone={articleStatusTone(place.status)} label={articleStatusLabel(place.status)} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
