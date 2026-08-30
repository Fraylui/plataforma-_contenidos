import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminArticles } from "@/lib/api/admin-client";
import { articleStatusLabel, articleStatusTone, articleTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, ListCard, StatusPill } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Publicaciones",
  robots: "noindex,nofollow",
};

export default async function AdminArticlesPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminArticles(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <AdminPageHeader title="Publicaciones" action={{ href: "/admin/articulos/nuevo", label: "Nueva publicación" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay artículos" description="Crea el primero para empezar." />
      ) : (
        <div className="mt-6 space-y-2">
          {sorted.map((article) => (
            <ListCard
              key={article.id}
              href={`/admin/articulos/${article.id}`}
              title={article.title}
              meta={`${articleTypeLabel(article.articleType)} · ${formatPublishedDate(article.createdAt)}`}
              pill={<StatusPill tone={articleStatusTone(article.status)} label={articleStatusLabel(article.status)} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
