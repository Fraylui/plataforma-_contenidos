import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdvertiser, getCampaign, getCampaignStats, listAdminAdPlacements } from "@/lib/api/admin/advertising";
import { listAdminImages } from "@/lib/api/admin/media";
import { listAdminCategories } from "@/lib/api/admin/taxonomy";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { parseDashboardRange } from "@/lib/admin/dashboard";
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
  searchParams,
}: {
  params: Promise<{ id: string; campaignId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, campaignId } = await params;
  const range = parseDashboardRange((await searchParams).range);
  const path = `/admin/anunciantes/${id}/campanas/${campaignId}`;
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(async () => {
    const advertiser = await getAdvertiser(accessToken, id);
    const campaign = await getCampaign(accessToken, campaignId);
    const placements = await listAdminAdPlacements(accessToken);
    const images = await listAdminImages(accessToken, "AD");
    // El doble del período: el actual y el anterior, para la variación.
    const stats = await getCampaignStats(accessToken, campaignId, range * 2);
    const categories = await listAdminCategories(accessToken);
    return { categories, advertiser, campaign, placements, images, stats };
  });
  if ("denied" in result) return <AccessDenied />;
  const { advertiser, campaign, placements, categories, images, stats } = result.data;

  return (
    <div>
      <AdminPageHeader title={`Campaña — ${advertiser.name}`} />
      <div className="mt-6">
        <CampaignReport
          campaign={campaign}
          stats={stats}
          range={range}
          hrefFor={(option) => (option === 30 ? path : `${path}?range=${option}`)}
        />
      </div>
      <div className="mt-6">
        <CampaignForm
          mode="edit"
          advertiserId={id}
          advertiserName={advertiser.name}
          advertiserLogoImageId={advertiser.logoImageId}
          advertiserIndustry={advertiser.industry}
          campaign={campaign}
          placements={placements}
          categories={categories}
          allImages={images}
        />
      </div>
    </div>
  );
}
