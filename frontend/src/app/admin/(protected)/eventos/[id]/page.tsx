import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  AdminApiError,
  getAdminEvent,
  listActiveCategoriesFresh,
  listAdminImages,
  listPlaceOptions,
} from "@/lib/api/admin-client";
import { getCategoryById, getPlatformSettings } from "@/lib/api/client";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { EventComposer } from "@/components/admin/event-composer";
import { AdminPageHeader } from "@/components/admin/ui";
import type { Category } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar evento",
  robots: "noindex,nofollow",
};

/** La categoría del evento puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(() => null);
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditEventPage(props: PageProps<"/admin/eventos/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let event;
  try {
    event = await getAdminEvent(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <p className="text-sm text-muted">No tienes acceso para ver este evento (pertenece a otro autor).</p>;
    }
    throw error;
  }

  const [activeCategories, allImages, places, settings] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listPlaceOptions(accessToken),
    getPlatformSettings(),
  ]);
  const categories = await resolveCategories(activeCategories, event.categoryId);
  const permissions = computePublicationPermissions(event, user, "events");

  return (
    <div className="space-y-6">
      <AdminPageHeader title={event.title} />
      <EventComposer
        event={event}
        categories={categories} places={places}
        allImages={allImages}
        permissions={permissions}
        siteName={settings.name}
      />
    </div>
  );
}
