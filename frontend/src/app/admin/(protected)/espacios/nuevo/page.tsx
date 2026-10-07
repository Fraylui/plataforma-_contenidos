import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdPlacementForm } from "@/components/admin/ad-placement-form";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Nuevo espacio publicitario",
  robots: "noindex,nofollow",
};

export default async function NewAdPlacementPage() {
  await requireAdminUser();

  return (
    <div>
      <AdminPageHeader title="Nuevo espacio publicitario" />
      <div className="mt-6">
        <AdPlacementForm mode="create" />
      </div>
    </div>
  );
}
