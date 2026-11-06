import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { accountLabel } from "@/lib/admin/role-labels";
import { detectTemplate, MODULE_LABELS } from "@/lib/admin/worker-templates";
import type { Module } from "@/lib/api/admin-types";
import { AdminPageHeader } from "@/components/admin/ui";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Badge, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: "noindex,nofollow",
};

/** Mi cuenta (cualquier usuario del panel): datos propios, alcance y cambio de contraseña. */
export default async function AccountPage() {
  const { user } = await requireAdminUser();
  // En el mismo orden que el menú del panel.
  const modules = (Object.keys(MODULE_LABELS) as Module[]).filter((module) => user.permissions[module]);

  return (
    <div>
      <AdminPageHeader title="Mi cuenta" />
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,28rem)]">
        <Card>
          <div className="flex items-center gap-4">
            <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl font-black text-accent">
              {user.firstName.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight text-foreground">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm break-all text-muted">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">{accountLabel(user)}</Badge>
            {user.role === "WORKER" && accountLabel(user) !== detectTemplate(user.permissions) && (
              <Badge tone="neutral">{detectTemplate(user.permissions)}</Badge>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Qué puedes hacer</p>
            {user.role === "OWNER" ? (
              <p className="mt-1 text-sm text-muted">Todo el panel, incluida la Actividad y las cuentas del equipo.</p>
            ) : modules.length === 0 ? (
              <p className="mt-1 text-sm text-muted">Todavía no tienes secciones asignadas. Pídeselas al dueño.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tus secciones">
                {modules.map((module) => (
                  <li key={module} className="rounded-full bg-field px-2.5 py-1 text-xs font-medium text-foreground">
                    {MODULE_LABELS[module]}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        <ChangePasswordForm temporary={user.mustChangePassword} />
      </div>
    </div>
  );
}
