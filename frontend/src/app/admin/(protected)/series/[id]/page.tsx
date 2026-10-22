import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminApiError, getAdminSeries, listActiveCategoriesFresh, listAdminEpisodes, listAdminImages } from "@/lib/api/admin-client";
import { getCategoryById } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/ui";
import { SeriesEditor } from "@/components/admin/series-editor";
import type { Category } from "@/lib/api/types";
import { orNull } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "Serie",
  robots: "noindex,nofollow",
};

/** El tema de la serie puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(orNull("admin.serie.tema"));
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function AdminSeriesDetailPage(props: PageProps<"/admin/series/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let series;
  try {
    series = await getAdminSeries(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    if (error instanceof AdminApiError && error.status === 403) return <AccessDenied />;
    throw error;
  }

  const [episodes, activeCategories, allImages] = await Promise.all([
    listAdminEpisodes(accessToken, id),
    listActiveCategoriesFresh(),
    listAdminImages(accessToken, "CONTENT"),
  ]);
  const categories = await resolveCategories(activeCategories, series.categoryId);

  return (
    <div className="space-y-6">
      <AdminPageHeader title={series.title} back={{ href: "/admin/series", label: "Series" }} />
      <SeriesEditor
        series={series}
        episodes={episodes}
        categories={categories}
        allImages={allImages}
        permissions={computePublicationPermissions(series, user, "series")}
      />
    </div>
  );
}
