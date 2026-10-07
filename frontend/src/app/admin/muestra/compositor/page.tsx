import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { ArticleComposer } from "@/components/admin/article-composer";
import type { Category } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Compositor (muestra)",
  robots: "noindex,nofollow",
};

const CATEGORIES: Category[] = [
  { id: "muestra-viajes", name: "Viajes", slug: "viajes", description: null, parentId: null, active: true, sortOrder: 0 },
  { id: "muestra-cultura", name: "Cultura", slug: "cultura", description: null, parentId: null, active: true, sortOrder: 1 },
];

/** El compositor con datos de ejemplo, para revisarlo sin sesión. Solo en desarrollo (en producción no existe). */
export default function ComposerShowcasePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <AdminPageHeader title="Nueva publicación" />
      <ArticleComposer
        categories={CATEGORIES}
        allImages={[]}
        siteName="Ecos del Camino"
        permissions={{ canEdit: true, canSubmit: false, canPublish: true, canSchedule: true, canReturnToDraft: false, canArchive: false }}
      />
    </main>
  );
}
