import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminUser } from "@/lib/admin/auth";
import { roleLabel } from "@/lib/admin/role-labels";

export const metadata: Metadata = {
  title: "Panel administrativo",
  robots: "noindex,nofollow",
};

export default async function AdminDashboardPage() {
  const { user } = await requireAdminUser();

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-2xl font-medium text-foreground">Bienvenido, {user.firstName} {user.lastName}</h1>
      <p className="mt-2 text-sm text-muted">
        Sesión activa como <strong className="text-foreground">{roleLabel(user.role)}</strong> ({user.email}).
      </p>

      {user.role === "SUPER_ADMIN" && !user.mfaEnabled && <MfaStatusNotice />}

      <div className="mt-8 rounded-lg border border-dashed border-border p-6 text-sm text-muted">
        Las secciones de contenido (artículos, categorías, geografía, medios, usuarios) se irán agregando aquí
        progresivamente — hoy solo está disponible el acceso y la configuración de seguridad de tu cuenta.
      </div>
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
