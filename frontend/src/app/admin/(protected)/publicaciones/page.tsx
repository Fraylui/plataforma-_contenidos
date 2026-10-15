import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminArticles } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { parseAdminListParams } from "@/lib/admin/list-params";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { PublicationsTable } from "@/components/admin/publications-table";

export const metadata: Metadata = {
  title: "Publicaciones",
  robots: "noindex,nofollow",
};

export default async function AdminArticlesPage(props: PageProps<"/admin/publicaciones">) {
  const { user, accessToken } = await requireAdminUser();
  const params = parseAdminListParams(await props.searchParams);
  const result = await fetchOrAccessDenied(() => listAdminArticles(accessToken, params));
  if ("denied" in result) return <AccessDenied />;
  const isEmpty = result.data.totalElements === 0 && !params.q && !params.status;

  return (
    <div>
      <AdminPageHeader title="Publicaciones" action={{ href: "/admin/publicaciones/nuevo", label: "Nueva publicación" }} />

      {isEmpty ? (
        <EmptyState title="Todavía no hay publicaciones" description="Crea el primero para empezar." />
      ) : (
        <div className="mt-6">
          <PublicationsTable page={result.data} currentUser={user} />
        </div>
      )}
    </div>
  );
}
