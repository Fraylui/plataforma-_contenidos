import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdPlacementForm } from "@/components/admin/ad-placement-form";

export const metadata: Metadata = {
  title: "Nueva posición de anuncio",
  robots: "noindex,nofollow",
};

export default async function NewAdPlacementPage() {
  await requireAdminUser();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Nueva posición de anuncio</h1>
      <div className="mt-6">
        <AdPlacementForm mode="create" />
      </div>
    </div>
  );
}
