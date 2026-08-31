import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminReviews } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { ReviewsTable } from "@/components/admin/reviews-table";

export const metadata: Metadata = {
  title: "Reseñas",
  robots: "noindex,nofollow",
};

export default async function AdminReviewsPage() {
  const { user, accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminReviews(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Reseñas" action={{ href: "/admin/resenas/nuevo", label: "Nueva reseña" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay reseñas" description="Crea la primera para empezar." />
      ) : (
        <div className="mt-6">
          <ReviewsTable reviews={sorted} currentUser={user} />
        </div>
      )}
    </div>
  );
}
