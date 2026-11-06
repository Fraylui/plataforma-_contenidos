import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminLive } from "@/lib/api/admin/live";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { LiveList } from "@/components/admin/live-list";

export const metadata: Metadata = {
  title: "En vivo",
  robots: "noindex,nofollow",
};

export default async function AdminLivePage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminLive(accessToken));
  if ("denied" in result) return <AccessDenied />;

  return (
    <div>
      <AdminPageHeader
        title="En vivo"
        description="Transmites en YouTube y se ve en tu sitio. Al empezar toca «Estamos en vivo»; al terminar, «Terminar» (si te olvidas, se apaga solo a las 12 horas)."
        action={{ href: "/admin/en-vivo/nueva", label: "Programar transmisión" }}
      />
      {result.data.items.length === 0 ? (
        <EmptyState
          title="Todavía no hay transmisiones"
          description="Programa la primera pegando el link de tu transmisión de YouTube."
          action={{ href: "/admin/en-vivo/nueva", label: "Programar transmisión" }}
        />
      ) : (
        <div className="mt-6">
          <LiveList streams={result.data.items} />
        </div>
      )}
    </div>
  );
}
