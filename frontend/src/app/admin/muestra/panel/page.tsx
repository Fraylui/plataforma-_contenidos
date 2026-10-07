import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ADMIN_NAV_GROUP_LABELS, createItems, groupedNavItems, visibleNavItems } from "@/lib/admin/nav";
import type { AdminUser } from "@/lib/api/admin-types";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { Badge, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Panel (muestra)",
  robots: "noindex,nofollow",
};

const OWNER: AdminUser = {
  id: "muestra",
  email: "dueno@ejemplo.pe",
  firstName: "Fray",
  lastName: "Luis",
  role: "OWNER",
  mustChangePassword: false,
  permissions: {},
};

/** La estructura del panel con un dueño de ejemplo, para revisarla sin sesión. Solo en desarrollo. */
export default function PanelShowcasePage() {
  if (process.env.NODE_ENV === "production") notFound();
  const groups = groupedNavItems(OWNER).map(({ group, items }) => ({
    group,
    label: ADMIN_NAV_GROUP_LABELS[group],
    items: items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: <item.icon aria-hidden="true" />,
      activeIcon: <item.icon weight="fill" aria-hidden="true" />,
    })),
  }));
  return (
    <AdminShell
      siteName="Ecos del Camino"
      groups={groups}
      navItems={visibleNavItems(OWNER).map((item) => ({ href: item.href, label: item.label }))}
      createItems={createItems(OWNER)}
      sidebarCollapsed={false}
      account={{ firstName: OWNER.firstName, lastName: OWNER.lastName, email: OWNER.email, roleLabel: "Dueño" }}
    >
      <div className="space-y-6">
        <AdminPageHeader title="Publicaciones" description="Todo lo que se publica en el sitio." action={{ href: "/admin/publicaciones/nuevo", label: "Nueva publicación" }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Publicado", "Pendiente de aprobación", "Programado", "Borrador"].map((label, i) => (
            <Card key={label}>
              <Badge tone={(["success", "info", "warning", "neutral"] as const)[i]} dot>
                {label}
              </Badge>
              <p className="text-3xl font-bold tabular-nums text-foreground">{[22, 3, 1, 5][i]}</p>
            </Card>
          ))}
        </div>
        <EmptyState title="Todavía no hay borradores" description="Lo que guardes sin publicar aparece aquí." action={{ href: "/admin/publicaciones/nuevo", label: "Crear publicación" }} />
      </div>
    </AdminShell>
  );
}
