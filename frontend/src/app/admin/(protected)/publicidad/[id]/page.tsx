import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdminAdPlacement } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdPlacementForm } from "@/components/admin/ad-placement-form";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Editar posición de anuncio",
  robots: "noindex,nofollow",
};

export default async function EditAdPlacementPage(props: PageProps<"/admin/publicidad/[id]">) {
  const { id } = await props.params;
  const { accessToken } = await requireAdminUser();

  const result = await fetchOrAccessDenied(() => getAdminAdPlacement(accessToken, id));
  if ("denied" in result) return <AccessDenied />;
  const placement = result.data;

  return (
    <div>
      <AdminPageHeader title={placement.label} />
      <div className="mt-6">
        <AdPlacementForm mode="edit" placement={placement} />
      </div>
    </div>
  );
}
