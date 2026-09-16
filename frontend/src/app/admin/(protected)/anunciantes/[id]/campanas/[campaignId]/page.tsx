import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdvertiser, getCampaign, listAdminAdPlacements, listAdminImages } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { CampaignForm } from "@/components/admin/campaign-form";
import { AdminPageHeader } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Editar campaña",
  robots: "noindex,nofollow",
};

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string; campaignId: string }>;
}) {
  const { id, campaignId } = await params;
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(async () => {
    const advertiser = await getAdvertiser(accessToken, id);
    const campaign = await getCampaign(accessToken, campaignId);
    const placements = await listAdminAdPlacements(accessToken);
    const images = await listAdminImages(accessToken);
    return { advertiser, campaign, placements, images };
  });
  if ("denied" in result) return <AccessDenied />;
  const { advertiser, campaign, placements, images } = result.data;

  return (
    <div>
      <AdminPageHeader title={`Campaña — ${advertiser.name}`} />
      <div className="mt-6">
        <CampaignForm
          mode="edit"
          advertiserId={id}
          campaign={campaign}
          placementOptions={placements.map((p) => ({ id: p.key, label: p.label }))}
          allImages={images}
        />
      </div>
    </div>
  );
}
