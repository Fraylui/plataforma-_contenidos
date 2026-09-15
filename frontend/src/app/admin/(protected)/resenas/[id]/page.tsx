import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  AdminApiError,
  getAdminReview,
  listActiveCategoriesFresh,
  listAdminImages,
  listAdminPlaces,
} from "@/lib/api/admin-client";
import { getCategoryById } from "@/lib/api/client";
import { computeReviewPermissions } from "@/lib/admin/review-permissions";
import { ReviewForm } from "@/components/admin/review-form";
import type { Category } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Editar reseña",
  robots: "noindex,nofollow",
};

/** La categoría de la reseña puede haberse desactivado desde que se asignó; igual debe verse en el selector. */
async function resolveCategories(activeCategories: Category[], categoryId: string): Promise<Category[]> {
  if (activeCategories.some((c) => c.id === categoryId)) return activeCategories;
  const current = await getCategoryById(categoryId).catch(() => null);
  return current ? [current, ...activeCategories] : activeCategories;
}

export default async function EditReviewPage(props: PageProps<"/admin/resenas/[id]">) {
  const { id } = await props.params;
  const { user, accessToken } = await requireAdminUser();

  let review;
  try {
    review = await getAdminReview(accessToken, id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof AdminApiError && error.status === 403) {
      return <p className="text-sm text-muted">No tienes acceso para ver esta reseña (pertenece a otro autor).</p>;
    }
    throw error;
  }

  const [activeCategories, allImages, places] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listAdminPlaces(accessToken),
  ]);
  const categories = await resolveCategories(activeCategories, review.categoryId);
  const permissions = computeReviewPermissions(review, user);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">{review.title}</h1>
      <div className="mt-6">
        <ReviewForm
          mode="edit"
          review={review}
          categories={categories}
          places={places}
          allImages={allImages}
          permissions={permissions}
        />
      </div>
    </div>
  );
}
