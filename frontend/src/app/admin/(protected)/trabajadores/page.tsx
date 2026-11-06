import type { Metadata } from "next";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireAdminUser } from "@/lib/admin/auth";
import { listWorkers } from "@/lib/api/admin/workers";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { detectTemplate } from "@/lib/admin/worker-templates";
import { formatShortDate } from "@/lib/content-labels";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { Badge } from "@/components/ui";

export const metadata: Metadata = {
  title: "Trabajadores",
  robots: "noindex,nofollow",
};

/** Trabajadores del panel (solo el dueño): quién es, qué plantilla tiene, si está activo y cuándo entró. */
export default async function WorkersPage() {
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listWorkers(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const workers = result.data;

  return (
    <div>
      <AdminPageHeader title="Trabajadores" action={{ href: "/admin/trabajadores/nuevo", label: "Agregar trabajador" }} />

      {workers.length === 0 ? (
        <EmptyState title="Todavía no hay trabajadores" />
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {workers.map((worker) => (
            <li key={worker.id}>
              <Link
                href={`/admin/trabajadores/${worker.id}`}
                className="group flex items-center gap-4 rounded-card bg-surface shadow-card p-4 transition-colors hover:bg-accent-soft/40"
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-black text-accent"
                >
                  {worker.firstName.charAt(0)}
                </span>
                <span className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_12rem_14rem] lg:items-center lg:gap-4">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-foreground">
                      {worker.firstName} {worker.lastName}
                    </span>
                    <span className="block truncate text-sm text-muted">{worker.email}</span>
                    {/* Bajo el correo y no en la fila: en el celular la etiqueta dejaba sin espacio al nombre. */}
                    {worker.status !== "ACTIVE" && <Badge tone="neutral" dot className="mt-1">Desactivado</Badge>}
                    {worker.status === "ACTIVE" && worker.mustChangePassword && (
                      <Badge tone="warning" dot className="mt-1">Contraseña temporal</Badge>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-foreground lg:mt-0">
                    <span className="sr-only">Permisos: </span>
                    {detectTemplate(worker.permissions)}
                  </span>
                  <span className="block text-sm text-muted">
                    {worker.lastLoginAt ? `Último ingreso: ${formatShortDate(worker.lastLoginAt)}` : "Aún no ingresa"}
                  </span>
                </span>
                <CaretRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
