import type { Metadata } from "next";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireAdminUser } from "@/lib/admin/auth";
import { listWorkers } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { detectTemplate } from "@/lib/admin/worker-templates";
import { formatPublishedDate } from "@/lib/content-labels";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState, StatusPill } from "@/components/admin/ui";

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
        <ul className="mt-6 flex max-w-3xl flex-col gap-2">
          {workers.map((worker) => (
            <li key={worker.id}>
              <Link
                href={`/admin/trabajadores/${worker.id}`}
                className="group flex items-center gap-4 rounded-2xl bg-surface p-4 transition-colors hover:bg-accent-soft/40"
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-soft text-base font-black text-accent"
                >
                  {worker.firstName.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-foreground">
                    {worker.firstName} {worker.lastName}
                  </span>
                  <span className="block truncate text-sm text-muted">
                    {worker.email} · {detectTemplate(worker.permissions)}
                    {worker.lastLoginAt ? ` · último ingreso ${formatPublishedDate(worker.lastLoginAt)}` : " · aún no ingresa"}
                  </span>
                </span>
                {worker.status !== "ACTIVE" && <StatusPill tone="neutral" label="Desactivado" />}
                {worker.status === "ACTIVE" && worker.mustChangePassword && <StatusPill tone="warning" label="Contraseña temporal" />}
                <CaretRight className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
