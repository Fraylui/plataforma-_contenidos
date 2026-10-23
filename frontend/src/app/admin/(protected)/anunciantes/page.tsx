import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdvertisers, listCampaigns } from "@/lib/api/admin/advertising";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminList, AdminListRow, AdminPageHeader, EmptyState } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Anunciantes",
  robots: "noindex,nofollow",
};

const NUMBER = new Intl.NumberFormat("es-PE");
const MONEY = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AdminAdvertisersPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(async () => {
    const advertisers = await listAdvertisers(accessToken);
    const campaigns = await listCampaigns(accessToken);
    return { advertisers, campaigns };
  });
  if ("denied" in result) return <AccessDenied />;
  const { advertisers, campaigns } = result.data;

  return (
    <div>
      <AdminPageHeader
        title="Anunciantes"
        description="Negocios que compran publicidad directa (banner o anuncio nativo en el feed), aparte de AdSense."
        action={{ href: "/admin/anunciantes/nuevo", label: "Nuevo anunciante" }}
      />

      {advertisers.length === 0 ? (
        <EmptyState title="Todavía no hay anunciantes" />
      ) : (
        <AdminList label="Anunciantes">
          {advertisers.map((advertiser) => {
            const own = campaigns.filter((c) => c.advertiserId === advertiser.id);
            const impressions = own.reduce((sum, c) => sum + c.impressionCount, 0);
            const clicks = own.reduce((sum, c) => sum + c.clickCount, 0);
            const billed = own.reduce((sum, c) => sum + (c.amount ?? 0), 0);
            const billedCurrency = own.find((c) => c.amount != null)?.currency ?? "";
            return (
              <AdminListRow
                key={advertiser.id}
                title={
                  <Link href={`/admin/anunciantes/${advertiser.id}`} className="[overflow-wrap:anywhere] hover:text-accent hover:underline">
                    {advertiser.name}
                  </Link>
                }
                meta={[
                  <span key="contact" className="[overflow-wrap:anywhere]">
                    {advertiser.contactEmail || advertiser.contactPhone || "Sin datos de contacto"}
                  </span>,
                  own.length === 1 ? "1 campaña" : `${own.length} campañas`,
                  billed > 0 ? `${billedCurrency} ${MONEY.format(billed)} facturado` : "Sin facturar",
                  `${NUMBER.format(impressions)} impresiones`,
                  clicks === 1 ? "1 clic" : `${NUMBER.format(clicks)} clics`,
                ]}
              />
            );
          })}
        </AdminList>
      )}
    </div>
  );
}
