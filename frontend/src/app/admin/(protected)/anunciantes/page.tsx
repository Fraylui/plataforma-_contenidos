import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdvertisers, listCampaigns } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";

export const metadata: Metadata = {
  title: "Anunciantes",
  robots: "noindex,nofollow",
};

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
        description="Empresas/negocios locales que compran publicidad directa (banner), a diferencia de AdSense."
        action={{ href: "/admin/anunciantes/nuevo", label: "Nuevo anunciante" }}
      />

      {advertisers.length === 0 ? (
        <EmptyState title="Todavía no hay anunciantes" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium text-muted">Anunciante</th>
                <th className="px-4 py-3 font-medium text-muted">Contacto</th>
                <th className="px-4 py-3 font-medium text-muted">Campañas</th>
                <th className="px-4 py-3 font-medium text-muted">Facturado</th>
                <th className="px-4 py-3 font-medium text-muted">Impresiones</th>
                <th className="px-4 py-3 font-medium text-muted">Clics</th>
              </tr>
            </thead>
            <tbody>
              {advertisers.map((advertiser) => {
                const own = campaigns.filter((c) => c.advertiserId === advertiser.id);
                const impressions = own.reduce((sum, c) => sum + c.impressionCount, 0);
                const clicks = own.reduce((sum, c) => sum + c.clickCount, 0);
                const billed = own.reduce((sum, c) => sum + (c.amount ?? 0), 0);
                const billedCurrency = own.find((c) => c.amount != null)?.currency ?? "";
                return (
                  <tr key={advertiser.id} className="border-b border-border last:border-0 hover:bg-accent-soft/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/anunciantes/${advertiser.id}`}
                        className="font-medium text-foreground hover:text-accent hover:underline"
                      >
                        {advertiser.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {advertiser.contactEmail || advertiser.contactPhone || "— sin datos —"}
                    </td>
                    <td className="px-4 py-3 text-muted">{own.length}</td>
                    <td className="px-4 py-3 text-muted">{billed > 0 ? `${billedCurrency} ${billed.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3 text-muted">{impressions}</td>
                    <td className="px-4 py-3 text-muted">{clicks}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
