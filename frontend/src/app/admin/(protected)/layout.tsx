import { requireAdminUser } from "@/lib/admin/auth";
import { ADMIN_NAV_GROUP_LABELS, groupedNavItems } from "@/lib/admin/nav";
import { roleLabel } from "@/lib/admin/role-labels";
import { logoutAction } from "./actions";
import { AdminNavLink } from "@/components/admin/admin-nav-link";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdminUser();
  const groups = groupedNavItems(user.role);

  return (
    <div className="flex min-h-dvh flex-col bg-background sm:flex-row">
      <aside className="flex flex-col border-b border-border bg-surface sm:w-56 sm:shrink-0 sm:border-b-0 sm:border-r">
        <div className="px-4 py-4">
          <span className="text-lg font-semibold text-foreground">Panel admin</span>
        </div>
        <nav aria-label="Panel administrativo" className="flex-1 space-y-4 px-2 pb-4">
          {groups.map(({ group, items }) => (
            <div key={group}>
              {ADMIN_NAV_GROUP_LABELS[group] ? (
                <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  {ADMIN_NAV_GROUP_LABELS[group]}
                </p>
              ) : null}
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <AdminNavLink href={item.href} label={item.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6">
          <div className="text-sm">
            <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
            <p className="text-muted">
              {user.email} · {roleLabel(user.role)}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
