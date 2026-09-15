import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminAdPlacements } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, StatusPill } from "@/components/admin/ui";
import { setAdPlacementActiveAction, deleteAdPlacementAction } from "./actions";

export const metadata: Metadata = {
  title: "Publicidad",
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
        title="Publicidad"
        action={{ href: "/admin/publicidad/nueva", label: "Nueva posición" }}
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
        <EmptyState title="Todavía no hay posiciones de anuncio" />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium text-muted">Posición</th>
                <th className="px-4 py-3 font-medium text-muted">Clave</th>
                <th className="px-4 py-3 font-medium text-muted">Slot de AdSense</th>
                <th className="px-4 py-3 font-medium text-muted">Estado</th>
                <th className="px-4 py-3 font-medium text-muted" />
              </tr>
            </thead>
            <tbody>
              {placements.map((placement) => (
                <tr key={placement.id} className="border-b border-border last:border-0 hover:bg-accent-soft/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/publicidad/${placement.id}`}
                      className="font-medium text-foreground hover:text-accent hover:underline"
                    >
                      {placement.label}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-muted">{placement.key}</code>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{placement.adsenseSlotId || "— sin completar —"}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={placement.enabled ? "success" : "neutral"}
                      label={placement.enabled ? "Activa" : "Inactiva"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <form action={setAdPlacementActiveAction.bind(null, placement.id, !placement.enabled)}>
                        <button
                          type="submit"
                          className="text-xs font-medium text-muted underline underline-offset-2 hover:text-accent"
                        >
                          {placement.enabled ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                      <form action={deleteAdPlacementAction.bind(null, placement.id)}>
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
    </div>
  );
}
