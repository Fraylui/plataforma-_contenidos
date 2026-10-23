import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdvertiser, listCampaigns } from "@/lib/api/admin/advertising";
import { listAdminImages } from "@/lib/api/admin/media";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdvertiserForm } from "@/components/admin/advertiser-form";
import { AdminList, AdminListRow, AdminPageHeader, ConfirmActionButton, EmptyState, ROW_ACTION_CLASS } from "@/components/admin/ui";
import { formatEventDateTime } from "@/lib/content-labels";
import { deleteAdvertiserAction, deleteCampaignAction, setCampaignActiveAction } from "../actions";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Anunciante",
  robots: "noindex,nofollow",
};

const NUMBER = new Intl.NumberFormat("es-PE");
const MONEY = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function AdvertiserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(async () => {
    const advertiser = await getAdvertiser(accessToken, id);
    const [campaigns, images] = await Promise.all([listCampaigns(accessToken, id), listAdminImages(accessToken, "AD")]);
    return { advertiser, campaigns, images };
  });
  if ("denied" in result) return <AccessDenied />;
  const { advertiser, campaigns, images } = result.data;

  return (
    <div className="space-y-6">
      <AdminPageHeader title={advertiser.name} action={{ href: `/admin/anunciantes/${id}/campanas/nueva`, label: "Nueva campaña" }} />

      <AdvertiserForm mode="edit" advertiser={advertiser} allImages={images} />

      <section>
        <h2 className="text-lg font-semibold text-foreground">Campañas</h2>
        {campaigns.length === 0 ? (
          <EmptyState title="Todavía no tiene campañas" />
        ) : (
          <AdminList label="Campañas">
            {campaigns.map((campaign) => (
              <AdminListRow
                key={campaign.id}
                title={
                  <Link href={`/admin/anunciantes/${id}/campanas/${campaign.id}`} className="hover:text-accent hover:underline">
                    {campaign.format === "NATIVE" ? "Post en el feed" : <code className="text-xs">{campaign.placementKey}</code>}
                  </Link>
                }
                meta={[
                  <Badge key="state" tone={campaign.active ? "success" : "neutral"} dot>
                    {campaign.active ? "Activa" : "Inactiva"}
                  </Badge>,
                  `${campaign.startsAt ? formatEventDateTime(campaign.startsAt) : "Desde siempre"} — ${
                    campaign.endsAt ? formatEventDateTime(campaign.endsAt) : "sin fin"
                  }`,
                  campaign.amount != null ? `${campaign.currency ?? ""} ${MONEY.format(campaign.amount)}` : "Sin monto",
                  `${NUMBER.format(campaign.impressionCount)} impresiones`,
                  campaign.clickCount === 1 ? "1 clic" : `${NUMBER.format(campaign.clickCount)} clics`,
                ]}
                actions={
                  <>
                    <form action={setCampaignActiveAction.bind(null, id, campaign.id, !campaign.active)}>
                      <button type="submit" className={ROW_ACTION_CLASS}>
                        {campaign.active ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                    <ConfirmActionButton
                      action={deleteCampaignAction.bind(null, id, campaign.id)}
                      label="Eliminar"
                      title="¿Eliminar esta campaña?"
                      description="Se borran también sus cifras de impresiones y clics. No se puede deshacer."
                    />
                  </>
                }
              />
            ))}
          </AdminList>
        )}
      </section>

      <section className="border-t border-border pt-6">
        <ConfirmActionButton
          action={deleteAdvertiserAction.bind(null, id)}
          label="Eliminar anunciante"
          title={`¿Eliminar a ${advertiser.name}?`}
          description="Se borra el anunciante y su logo deja de usarse. No se puede deshacer."
        />
        {campaigns.length > 0 && (
          <p className="mt-1 text-xs text-muted">Elimina primero sus campañas — un anunciante con campañas no se puede borrar.</p>
        )}
      </section>
    </div>
  );
}
