import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { isOwner } from "@/lib/admin/permissions";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader } from "@/components/admin/ui";
import { WorkerForm } from "@/components/admin/workers/worker-form";

export const metadata: Metadata = {
  title: "Agregar trabajador",
  robots: "noindex,nofollow",
};

export default async function NewWorkerPage() {
  const { user } = await requireAdminUser();
  if (!isOwner(user)) return <AccessDenied />;

  return (
    <div>
      <AdminPageHeader title="Agregar trabajador" />
      <div className="mt-6">
        <WorkerForm />
      </div>
    </div>
  );
}
