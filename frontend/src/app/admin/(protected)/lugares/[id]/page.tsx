import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminApiError, getAdminPlace, listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { getCategoryById, getGeographyUnitById } from "@/lib/api/client";
import { computePlacePermissions } from "@/lib/admin/place-permissions";
import { PlaceForm } from "@/components/admin/place-form";
import type { Category, GeographicUnit } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar lugar",
  robots: "noindex,nofollow",
};

/** Camino PAIS -> ... -> unidad seleccionada, para precargar el selector en cascada. */
async function resolveGeographyChain(geographyId: string | null): Promise<GeographicUnit[]> {
  if (!geographyId) return [];
  const chain: GeographicUnit[] = [];
  let current: GeographicUnit | null = await getGeographyUnitById(geographyId).catch(() => null);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? await getGeographyUnitById(current.parentId).catch(() => null) : null;
  }
  return chain;
}

/** La categoría del lugar puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(() => null);
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditPlacePage(props: PageProps<"/admin/lugares/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let place;
  try {
    place = await getAdminPlace(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <p className="text-sm text-muted">No tienes acceso para ver este lugar (pertenece a otro autor).</p>;
    }
    throw error;
  }

  const [activeCategories, allImages, geographyChain] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    resolveGeographyChain(place.geographyId),
  ]);
  const categories = await resolveCategories(activeCategories, place.categoryId);
  const permissions = computePlacePermissions(place, user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{place.name}</h1>
      <div className="mt-6">
        <PlaceForm
          mode="edit"
          place={place}
          categories={categories}
          allImages={allImages}
          initialGeographyChain={geographyChain}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
