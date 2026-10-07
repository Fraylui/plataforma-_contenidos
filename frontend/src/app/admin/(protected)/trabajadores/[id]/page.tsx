import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { listWorkers } from "@/lib/api/admin-client";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/ui";
import { WorkerForm } from "@/components/admin/workers/worker-form";

export const metadata: Metadata = {
  title: "Trabajador",
  robots: "noindex,nofollow",
};

/** Ficha de un trabajador: permisos, restablecer contraseña y desactivar. La lista es corta: se toma de ahí. */
export default async function WorkerPage(props: PageProps<"/admin/trabajadores/[id]">) {
  const { id } = await props.params;
  const { accessToken } = await requireAdminUser();
  const result = await fetchOrAccessDenied(() => listWorkers(accessToken));
  if ("denied" in result) return <AccessDenied />;
  const worker = result.data.find((w) => w.id === id);
  if (!worker) notFound();

  return (
    <div>
      <AdminPageHeader title={`${worker.firstName} ${worker.lastName}`} />
      <div className="mt-6">
        <WorkerForm key={worker.id + JSON.stringify(worker.permissions) + worker.status} worker={worker} />
      </div>
    </div>
  );
}
