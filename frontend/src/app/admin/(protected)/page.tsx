import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { roleLabel } from "@/lib/admin/role-labels";
import { visibleNavItems } from "@/lib/admin/nav";

export const metadata: Metadata = {
  title: "Panel administrativo",
  robots: "noindex,nofollow",
};

const QUICK_CREATE: { label: string; href: string; navHref: string }[] = [
  { label: "Artículo", href: "/admin/articulos/nuevo", navHref: "/admin/articulos" },
  { label: "Lugar", href: "/admin/lugares/nuevo", navHref: "/admin/lugares" },
  { label: "Evento", href: "/admin/eventos/nuevo", navHref: "/admin/eventos" },
  { label: "Galería", href: "/admin/galerias/nuevo", navHref: "/admin/galerias" },
  { label: "Reseña", href: "/admin/resenas/nuevo", navHref: "/admin/resenas" },
  { label: "Ficha de directorio", href: "/admin/directorio/nuevo", navHref: "/admin/directorio" },
];

export default async function AdminDashboardPage() {
  const { user } = await requireAdminUser();
  const allowedHrefs = new Set(visibleNavItems(user.role).map((item) => item.href));
  const quickCreate = QUICK_CREATE.filter((item) => allowedHrefs.has(item.navHref));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-foreground">Bienvenido, {user.firstName} {user.lastName}</h1>
      <p className="mt-2 text-sm text-muted">
        Sesión activa como <strong className="text-foreground">{roleLabel(user.role)}</strong> ({user.email}).
      </p>

      {user.role === "SUPER_ADMIN" && !user.mfaEnabled && <MfaStatusNotice />}

      {quickCreate.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Crear contenido</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickCreate.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-accent hover:text-accent"
              >
                + {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MfaStatusNotice() {
  return (
    <div className="mt-4 rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent">
      Como super administrador, la autenticación en dos pasos es obligatoria (CONTEXTO.md §36.5) y todavía no la
      configuraste.{" "}
      <Link href="/admin/mfa-setup" className="font-medium underline underline-offset-2">
        Actívala ahora
      </Link>
      .
    </div>
  );
}
