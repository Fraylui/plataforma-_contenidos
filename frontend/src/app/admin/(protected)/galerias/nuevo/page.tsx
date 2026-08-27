import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listActiveCategoriesFresh, listAdminImages } from "@/lib/api/admin-client";
import { GalleryForm } from "@/components/admin/gallery-form";

export const metadata: Metadata = {
  title: "Nueva galería",
  robots: "noindex,nofollow",
};

export default async function NewGalleryPage() {
  const { accessToken } = await requireAdminUser();
  const [categories, allImages] = await Promise.all([listActiveCategoriesFresh(), listAdminImages(accessToken)]);

  return (
    <div>
      <h1 className="font-serif text-2xl font-medium text-foreground">Nueva galería</h1>
      <div className="mt-6">
        <GalleryForm mode="create" categories={categories} allImages={allImages} initialGeographyChain={[]} />
      </div>
    </div>
  );
}
