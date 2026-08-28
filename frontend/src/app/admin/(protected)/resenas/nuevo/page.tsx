import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages, listAdminPlaces } from "@/lib/api/admin-client";
import { ReviewForm } from "@/components/admin/review-form";

export const metadata: Metadata = {
  title: "Nueva reseña",
  robots: "noindex,nofollow",
};

export default async function NewReviewPage() {
  const { accessToken } = await requireAdminUser();
  const [categories, allImages, places] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listAdminPlaces(accessToken),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nueva reseña</h1>
      <div className="mt-6">
        <ReviewForm mode="create" categories={categories} places={places} allImages={allImages} initialGeographyChain={[]} />
      </div>
    </div>
  );
}
