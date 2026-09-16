import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdvertiser, listAdminAdPlacements, listAdminImages } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { CampaignForm } from "@/components/admin/campaign-form";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Nueva campaña",
  robots: "noindex,nofollow",
};

export default async function NewCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(async () => {
    const advertiser = await getAdvertiser(accessToken, id);
    const placements = await listAdminAdPlacements(accessToken);
    const images = await listAdminImages(accessToken);
    return { advertiser, placements, images };
  });
  if ("denied" in result) return <AccessDenied />;
  const { advertiser, placements, images } = result.data;

  return (
    <div>
      <AdminPageHeader title={`Nueva campaña — ${advertiser.name}`} />
      <div className="mt-6">
        <CampaignForm
          mode="create"
          advertiserId={id}
          placementOptions={placements.map((p) => ({ id: p.key, label: p.label }))}
          allImages={images}
        />
      </div>
    </div>
  );
}
