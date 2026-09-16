import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { getAdvertiser, listCampaigns } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdvertiserForm } from "@/components/admin/advertiser-form";
import { AdminPageHeader, EmptyState, StatusPill } from "@/components/admin/ui";
import { formatEventDateTime } from "@/lib/content-labels";
import { deleteAdvertiserAction, deleteCampaignAction, setCampaignActiveAction } from "../actions";

export const metadata: Metadata = {
  title: "Anunciante",
  robots: "noindex,nofollow",
};

export default async function AdvertiserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(async () => {
    const advertiser = await getAdvertiser(accessToken, id);
    const campaigns = await listCampaigns(accessToken, id);
    return { advertiser, campaigns };
  });
  if ("denied" in result) return <AccessDenied />;
  const { advertiser, campaigns } = result.data;

  return (
    <div className="space-y-8">
      <AdminPageHeader title={advertiser.name} action={{ href: `/admin/anunciantes/${id}/campanas/nueva`, label: "Nueva campaña" }} />

      <AdvertiserForm mode="edit" advertiser={advertiser} />

      <section>
        <h2 className="text-lg font-semibold text-foreground">Campañas</h2>
        {campaigns.length === 0 ? (
          <EmptyState title="Todavía no tiene campañas" />
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium text-muted">Posición</th>
                  <th className="px-4 py-3 font-medium text-muted">Vigencia</th>
                  <th className="px-4 py-3 font-medium text-muted">Estado</th>
                  <th className="px-4 py-3 font-medium text-muted">Impresiones</th>
                  <th className="px-4 py-3 font-medium text-muted">Clics</th>
                  <th className="px-4 py-3 font-medium text-muted" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-border last:border-0 hover:bg-accent-soft/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/anunciantes/${id}/campanas/${campaign.id}`}
                        className="font-medium text-foreground hover:text-accent hover:underline"
                      >
                        <code className="text-xs">{campaign.placementKey}</code>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {campaign.startsAt ? formatEventDateTime(campaign.startsAt) : "Desde siempre"}
                      {" — "}
                      {campaign.endsAt ? formatEventDateTime(campaign.endsAt) : "sin fin"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={campaign.active ? "success" : "neutral"} label={campaign.active ? "Activa" : "Inactiva"} />
                    </td>
                    <td className="px-4 py-3 text-muted">{campaign.impressionCount}</td>
                    <td className="px-4 py-3 text-muted">{campaign.clickCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <form action={setCampaignActiveAction.bind(null, id, campaign.id, !campaign.active)}>
                          <button
                            type="submit"
                            className="text-xs font-medium text-muted underline underline-offset-2 hover:text-accent"
                          >
                            {campaign.active ? "Desactivar" : "Activar"}
                          </button>
                        </form>
                        <form action={deleteCampaignAction.bind(null, id, campaign.id)}>
                          <button
                            type="submit"
                            className="text-xs font-medium text-muted underline underline-offset-2 hover:text-red-500"
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border-t border-border pt-6">
        <form action={deleteAdvertiserAction.bind(null, id)}>
          <button type="submit" className="text-sm font-medium text-red-600 underline underline-offset-2 hover:text-red-500">
            Eliminar anunciante
          </button>
        </form>
        {campaigns.length > 0 && (
          <p className="mt-1 text-xs text-muted">Elimina primero sus campañas — un anunciante con campañas no se puede borrar.</p>
        )}
      </section>
    </div>
  );
}
