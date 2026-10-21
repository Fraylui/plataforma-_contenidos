import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminImages } from "@/lib/api/admin-client";
import { AdvertiserForm } from "@/components/admin/advertiser-form";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Nuevo anunciante",
  robots: "noindex,nofollow",
};

export default async function NewAdvertiserPage() {
  const { accessToken } = await requireAdminUser();
  const images = await listAdminImages(accessToken, "AD");

  return (
    <div>
      <AdminPageHeader title="Nuevo anunciante" />
      <div className="mt-6">
        <AdvertiserForm mode="create" allImages={images} />
      </div>
    </div>
  );
}
