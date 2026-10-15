import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminEvents } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { parseAdminListParams } from "@/lib/admin/list-params";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { EventsTable } from "@/components/admin/events-table";

export const metadata: Metadata = {
  title: "Eventos",
  robots: "noindex,nofollow",
};

export default async function AdminEventsPage(props: PageProps<"/admin/eventos">) {
  const { user, accessToken } = await requireAdminUser();
  const params = parseAdminListParams(await props.searchParams);
  const result = await fetchOrAccessDenied(() => listAdminEvents(accessToken, params));
  if ("denied" in result) return <AccessDenied />;
  const isEmpty = result.data.totalElements === 0 && !params.q && !params.status;

  return (
    <div>
      <AdminPageHeader title="Eventos" action={{ href: "/admin/eventos/nuevo", label: "Nuevo evento" }} />

      {isEmpty ? (
        <EmptyState title="Todavía no hay eventos" description="Crea el primero para empezar." action={{ href: "/admin/eventos/nuevo", label: "Crear evento" }} />
      ) : (
        <div className="mt-6">
          <EventsTable page={result.data} currentUser={user} />
        </div>
      )}
    </div>
  );
}
