import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminGalleries } from "@/lib/api/admin-client";
import { articleStatusLabel, articleStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";

export const metadata: Metadata = {
  title: "Galerías",
  robots: "noindex,nofollow",
};

const TONE_CLASSES: Record<string, string> = {
  neutral: "bg-border text-foreground",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-300",
  success: "bg-accent-soft text-accent",
  danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export default async function AdminGalleriesPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminGalleries(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-medium text-foreground">Galerías</h1>
        <Link
          href="/admin/galerias/nuevo"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Nueva galería
        </Link>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-8 text-sm text-muted">Todavía no hay galerías. Crea la primera.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Fotos</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Creado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((gallery) => (
                <tr key={gallery.id} className="border-b border-border last:border-0 hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link href={`/admin/galerias/${gallery.id}`} className="font-medium text-foreground hover:text-accent">
                      {gallery.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{gallery.imageIds.length}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_CLASSES[articleStatusTone(gallery.status)]}`}
                    >
                      {articleStatusLabel(gallery.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{formatPublishedDate(gallery.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
