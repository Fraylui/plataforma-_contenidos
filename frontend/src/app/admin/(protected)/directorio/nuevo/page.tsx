import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages, listAdminPlaces } from "@/lib/api/admin-client";
import { BusinessForm } from "@/components/admin/business-form";

export const metadata: Metadata = {
  title: "Nueva ficha de directorio",
  robots: "noindex,nofollow",
};

export default async function NewBusinessPage() {
  const { accessToken } = await requireAdminUser();
  const [categories, allImages, places] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminImages(accessToken),
    listAdminPlaces(accessToken),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nueva ficha de directorio</h1>
      <div className="mt-6">
        <BusinessForm mode="create" categories={categories} places={places} allImages={allImages} initialGeographyChain={[]} />
      </div>
    </div>
  );
}
