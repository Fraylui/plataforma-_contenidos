import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import {
  getAdvertiser,
  getCampaign,
  getCampaignStats,
  listAdminAdPlacements,
  listAdminCategories,
  listAdminImages,
} from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { CampaignForm } from "@/components/admin/campaign-form";
import { CampaignReport } from "@/components/admin/campaign-report";
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
    const stats = await getCampaignStats(accessToken, campaignId);
    const categories = await listAdminCategories(accessToken);
    return { categories, advertiser, campaign, placements, images, stats };
  });
  if ("denied" in result) return <AccessDenied />;
  const { advertiser, campaign, placements, categories, images, stats } = result.data;

  return (
    <div>
      <AdminPageHeader title={`Campaña — ${advertiser.name}`} />
      <div className="mt-6 max-w-3xl">
        <CampaignReport campaign={campaign} stats={stats} />
      </div>
      <div className="mt-6">
        <CampaignForm
          mode="edit"
          advertiserId={id}
          campaign={campaign}
          placements={placements}
          categories={categories}
          allImages={images}
        />
      </div>
    </div>
  );
}
