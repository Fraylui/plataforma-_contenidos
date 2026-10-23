import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminAdPlacements } from "@/lib/api/admin/advertising";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminList, AdminListRow, AdminPageHeader, ConfirmActionButton, EmptyState, ROW_ACTION_CLASS } from "@/components/admin/ui";
import { formatSize } from "@/lib/ads/ad-formats";
import { setAdPlacementActiveAction, deleteAdPlacementAction } from "./actions";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Espacios publicitarios",
  robots: "noindex,nofollow",
};

export default async function AdminAdPlacementsPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminAdPlacements(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const placements = result.data;

  return (
    <div>
      <AdminPageHeader
        title="Espacios publicitarios"
        action={{ href: "/admin/espacios/nuevo", label: "Nuevo espacio" }}
      />
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Posiciones de anuncio (AdSense) disponibles para usar en el sitio con{" "}
        <code className="rounded bg-surface px-1 py-0.5 text-xs">{"<AdBlock position=\"key\" />"}</code>. El
        interruptor global de AdSense está en{" "}
        <Link href="/admin/configuracion" className="underline underline-offset-2 hover:text-accent">
          Configuración
        </Link>
        .
      </p>

      {placements.length === 0 ? (
        <EmptyState title="Todavía no hay espacios publicitarios" />
      ) : (
        <AdminList label="Espacios publicitarios">
          {placements.map((placement) => (
            <AdminListRow
              key={placement.id}
              title={
                <Link href={`/admin/espacios/${placement.id}`} className="hover:text-accent hover:underline">
                  {placement.label}
                </Link>
              }
              meta={[
                <Badge key="state" tone={placement.enabled ? "success" : "neutral"} dot>
                  {placement.enabled ? "Activa" : "Inactiva"}
                </Badge>,
                <code key="key">{placement.key}</code>,
                <span key="size" className="whitespace-nowrap text-foreground">{formatSize(placement.width, placement.height)}</span>,
                placement.adsenseSlotId ? `Slot ${placement.adsenseSlotId}` : "Sin slot de AdSense",
              ]}
              actions={
                <>
                  <form action={setAdPlacementActiveAction.bind(null, placement.id, !placement.enabled)}>
                    <button type="submit" className={ROW_ACTION_CLASS}>
                      {placement.enabled ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                  <ConfirmActionButton
                    action={deleteAdPlacementAction.bind(null, placement.id)}
                    label="Eliminar"
                    title={`¿Eliminar el espacio «${placement.label}»?`}
                    description="Los anuncios que lo usan dejan de mostrarse ahí. No se puede deshacer."
                  />
                </>
              }
            />
          ))}
        </AdminList>
      )}
    </div>
  );
}
