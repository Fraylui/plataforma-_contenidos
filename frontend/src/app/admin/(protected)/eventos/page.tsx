import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminEvents } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { EventsTable } from "@/components/admin/events-table";

export const metadata: Metadata = {
  title: "Eventos",
  robots: "noindex,nofollow",
};

export default async function AdminEventsPage() {
  const { user, accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listAdminEvents(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const sorted = [...result.data].sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return (
    <div>
      <AdminPageHeader title="Eventos" action={{ href: "/admin/eventos/nuevo", label: "Nuevo evento" }} />

      {sorted.length === 0 ? (
        <EmptyState title="Todavía no hay eventos" description="Crea el primero para empezar." />
      ) : (
        <div className="mt-6">
          <EventsTable events={sorted} currentUser={user} />
        </div>
      )}
    </div>
  );
}
