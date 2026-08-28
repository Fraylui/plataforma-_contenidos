import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminGalleries } from "@/lib/api/admin-client";
import { articleStatusLabel, articleStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, ListCard, StatusPill } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Galerías",
  robots: "noindex,nofollow",
};

export default async function AdminGalleriesPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminGalleries(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Galerías" action={{ href: "/admin/galerias/nuevo", label: "Nueva galería" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay galerías" description="Crea la primera para empezar." />
      ) : (
        <div className="mt-6 space-y-2">
          {sorted.map((gallery) => (
            <ListCard
              key={gallery.id}
              href={`/admin/galerias/${gallery.id}`}
              title={gallery.title}
              meta={`${gallery.imageIds.length} foto${gallery.imageIds.length === 1 ? "" : "s"} · ${formatPublishedDate(gallery.createdAt)}`}
              pill={<StatusPill tone={articleStatusTone(gallery.status)} label={articleStatusLabel(gallery.status)} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
