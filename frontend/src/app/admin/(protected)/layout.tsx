import { requireAdminUser } from "@/lib/admin/auth";
import { cookies } from "next/headers";
import { ADMIN_NAV_GROUP_LABELS, createItems, groupedNavItems, visibleNavItems } from "@/lib/admin/nav";
import { getPlatformSettings } from "@/lib/api/client";
import { accountLabel } from "@/lib/admin/role-labels";
import { logoutAction } from "./actions";
import { AdminShell } from "@/components/admin/shell/admin-shell";
import { SIDEBAR_COOKIE } from "@/components/admin/shell/constants";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdminUser();

  // Contraseña temporal: en cualquier URL del panel solo se puede cambiarla
  // (el servidor rechaza todo lo demás con PASSWORD_CHANGE_REQUIRED).
  if (user.mustChangePassword) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-10">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Hola, {user.firstName}</h1>
          <p className="mt-1 text-sm text-muted">Antes de empezar, elige tu contraseña.</p>
        </div>
        <div className="w-full max-w-md">
          <ChangePasswordForm temporary />
        </div>
        <form action={logoutAction}>
          <button type="submit" className="cursor-pointer text-sm font-medium text-muted hover:text-foreground">
            Cerrar sesión
          </button>
        </form>
      </div>
    );
  }

  const groups = groupedNavItems(user).map(({ group, items }) => ({
    group,
    label: ADMIN_NAV_GROUP_LABELS[group],
    items: items.map((item) => ({
      href: item.href,
      label: item.label,
      icon: <item.icon aria-hidden="true" />,
      activeIcon: <item.icon weight="fill" aria-hidden="true" />,
    })),
  }));
  const [settings, cookieStore] = await Promise.all([getPlatformSettings(), cookies()]);

  return (
    <AdminShell
      siteName={settings.name}
      groups={groups}
      navItems={visibleNavItems(user).map((item) => ({ href: item.href, label: item.label }))}
      createItems={createItems(user)}
      sidebarCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      account={{ firstName: user.firstName, lastName: user.lastName, email: user.email, roleLabel: accountLabel(user) }}
    >
      {children}
    </AdminShell>
  );
}
