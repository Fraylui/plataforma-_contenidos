import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminArticles } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { PublicationsTable } from "@/components/admin/publications-table";

export const metadata: Metadata = {
  title: "Publicaciones",
  robots: "noindex,nofollow",
};

export default async function AdminArticlesPage() {
  const { user, accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminArticles(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Publicaciones" action={{ href: "/admin/publicaciones/nuevo", label: "Nueva publicación" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay artículos" description="Crea el primero para empezar." />
      ) : (
        <div className="mt-6">
          <PublicationsTable articles={sorted} currentUser={user} />
        </div>
      )}
    </div>
  );
}
