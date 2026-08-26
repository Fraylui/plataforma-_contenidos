import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminArticles } from "@/lib/api/admin-client";
import { articleStatusLabel, articleStatusTone, articleTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";

export const metadata: Metadata = {
  title: "Artículos",
  robots: "noindex,nofollow",
};

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-border text-foreground",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  success: "bg-accent-soft text-accent",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default async function AdminArticlesPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminArticles(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium text-foreground">Artículos</h1>
        <Link
          href="/admin/articulos/nuevo"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Nuevo artículo
        </Link>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Todavía no hay artículos. Crea el primero.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((article) => (
                <tr key={article.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/admin/articulos/${article.id}`} className="font-medium text-foreground hover:text-accent">
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{articleTypeLabel(article.articleType)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[articleStatusTone(article.status)]}`}
                    >
                      {articleStatusLabel(article.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatPublishedDate(article.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
