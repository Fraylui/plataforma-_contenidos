import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  AdminApiError,
  getAdminEvent,
  listActiveCategoriesFresh,
  listAdminImages,
  listAdminPlaces,
} from "@/lib/api/admin-client";
import { getCategoryById } from "@/lib/api/client";
import { computeEventPermissions } from "@/lib/admin/event-permissions";
import { EventForm } from "@/components/admin/event-form";
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

  const [activeCategories, allImages, places] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listAdminPlaces(accessToken),
  ]);
  const categories = await resolveCategories(activeCategories, event.categoryId);
  const permissions = computeEventPermissions(event, user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{event.title}</h1>
      <div className="mt-6">
        <EventForm
          mode="edit"
          event={event}
          categories={categories}
          places={places}
          allImages={allImages}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
