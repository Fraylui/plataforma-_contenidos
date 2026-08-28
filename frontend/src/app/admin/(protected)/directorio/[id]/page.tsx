import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  AdminApiError,
  getAdminBusiness,
  listActiveCategoriesFresh,
  listAdminImages,
  listAdminPlaces,
} from "@/lib/api/admin-client";
import { getCategoryById, getGeographyUnitById } from "@/lib/api/client";
import { computeBusinessPermissions } from "@/lib/admin/business-permissions";
import { BusinessForm } from "@/components/admin/business-form";
import type { Category, GeographicUnit } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar ficha de directorio",
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

/** La categoría de la ficha puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(() => null);
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditBusinessPage(props: PageProps<"/admin/directorio/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let business;
  try {
    business = await getAdminBusiness(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <p className="text-sm text-muted">No tienes acceso para ver esta ficha (pertenece a otro autor).</p>;
    }
    throw error;
  }

  const [activeCategories, allImages, places, geographyChain] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listAdminPlaces(accessToken),
    resolveGeographyChain(business.geographyId),
  ]);
  const categories = await resolveCategories(activeCategories, business.categoryId);
  const permissions = computeBusinessPermissions(business, user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{business.name}</h1>
      <div className="mt-6">
        <BusinessForm
          mode="edit"
          business={business}
          categories={categories}
          places={places}
          allImages={allImages}
          initialGeographyChain={geographyChain}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
