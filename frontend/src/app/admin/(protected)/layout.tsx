import { requireAdminUser } from "@/lib/admin/auth";
import { ADMIN_NAV_GROUP_LABELS, groupedNavItems } from "@/lib/admin/nav";
import { roleLabel } from "@/lib/admin/role-labels";
import { logoutAction } from "./actions";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdminUser();
  const groups = groupedNavItems(user.role);

  return (
    // sm+: "cáscara de app" fijada al viewport (position:fixed + inset:0),
    // no solo alta como el viewport (h-dvh) — con solo h-dvh, el <body> (que
    // no tiene su propia altura fija) seguía siendo scrolleable si por
    // redondeo/unidades dvh el contenido quedaba un poco más alto, y como
    // <body> es el que scrollea, arrastraba TODO junto (sidebar incluido)
    // en vez de solo <main>. Con fixed, este contenedor queda anclado al
    // viewport pase lo que pase — <body> nunca tiene nada que scrollear.
    // Menú y contenido son cada uno su propia región de scroll interna. En
    // mobile queda flujo normal de documento (no tiene sentido encerrar el
    // scroll en pantallas chicas).
    <div className="flex flex-col bg-background sm:fixed sm:inset-0 sm:flex-row sm:overflow-hidden">
      {/* Mismo fondo que el contenido (--background), no una superficie aparte:
          un solo borde alcanza para separar "dónde estoy navegando" de "qué
          estoy viendo", en vez de fragmentar la pantalla en dos bloques de
          color (criterio del skill de diseño de interfaces). */}
      <aside className="flex flex-col border-b border-border sm:h-full sm:w-60 sm:shrink-0 sm:overflow-hidden sm:border-b-0 sm:border-r">
        <div className="flex shrink-0 items-center gap-2 px-4 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
            P
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">Panel admin</span>
        </div>
        <nav aria-label="Panel administrativo" className="min-h-0 flex-1 space-y-2 px-3 pb-4 sm:overflow-y-auto">
          <AdminNav
            groups={groups.map(({ group, items }) => ({
              group,
              label: ADMIN_NAV_GROUP_LABELS[group],
              items: items.map((item) => ({
                href: item.href,
                label: item.label,
                icon: <item.icon aria-hidden="true" />,
              })),
            }))}
          />
        </nav>
      </aside>

      {/* min-h-0: por defecto un hijo flex nunca se encoge más chico que su
          contenido (min-height:auto), así que aunque el padre mida h-dvh, si
          el contenido de una página es más alto se "escapa" del contenedor
          en vez de scrollear adentro — eso empujaba el <body> entero y
          generaba el scroll doble (el del navegador + el interno) que se
          reportó. min-h-0 fuerza a que SÍ se recorte y el scroll quede
          únicamente dentro de <main>. */}
      <div className="flex flex-1 flex-col sm:min-h-0 sm:overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
          <div className="text-sm">
            <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
            <p className="text-muted">
              {user.email} · {roleLabel(user.role)}
            </p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent-soft hover:text-accent"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        <main className="flex-1 px-4 py-6 sm:min-h-0 sm:overflow-y-auto sm:px-6">{children}</main>
      </div>
    </div>
  );
}
