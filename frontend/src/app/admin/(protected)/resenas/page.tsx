import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminReviews } from "@/lib/api/admin-client";
import { articleStatusLabel, articleStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, ListCard, StatusPill } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Reseñas",
  robots: "noindex,nofollow",
};

export default async function AdminReviewsPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminReviews(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Reseñas" action={{ href: "/admin/resenas/nuevo", label: "Nueva reseña" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay reseñas" description="Crea la primera para empezar." />
      ) : (
        <div className="mt-6 space-y-2">
          {sorted.map((review) => (
            <ListCard
              key={review.id}
              href={`/admin/resenas/${review.id}`}
              title={review.title}
              meta={`${review.rating} / 5 · ${formatPublishedDate(review.createdAt)}`}
              pill={<StatusPill tone={articleStatusTone(review.status)} label={articleStatusLabel(review.status)} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
