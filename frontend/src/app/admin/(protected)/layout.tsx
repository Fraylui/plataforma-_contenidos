import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { visibleNavItems } from "@/lib/admin/nav";
import { roleLabel } from "@/lib/admin/role-labels";
import { logoutAction } from "./actions";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdminUser();
  const navItems = visibleNavItems(user.role);

  return (
    <div className="flex min-h-dvh flex-col bg-background sm:flex-row">
      <aside className="flex flex-col border-b border-border bg-surface sm:w-56 sm:shrink-0 sm:border-b-0 sm:border-r">
        <div className="px-4 py-4">
          <span className="font-serif text-lg font-medium text-foreground">Panel admin</span>
        </div>
        <nav aria-label="Panel administrativo" className="flex-1 px-2 pb-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent-soft hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-3 sm:px-6">
          <div className="text-sm">
            <p className="font-medium text-foreground">{user.displayName}</p>
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
