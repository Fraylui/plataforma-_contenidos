import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { PlaceForm } from "@/components/admin/place-form";

export const metadata: Metadata = {
  title: "Nuevo lugar",
  robots: "noindex,nofollow",
};

export default async function NewPlacePage() {
  const { accessToken } = await requireAdminUser();
  const [categories, allImages] = await Promise.all([listActiveCategoriesFresh(), listAdminImages(accessToken)]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nuevo lugar</h1>
      <div className="mt-6">
        <PlaceForm mode="create" categories={categories} allImages={allImages} initialGeographyChain={[]} />
      </div>
    </div>
  );
}
