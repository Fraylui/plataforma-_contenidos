import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminPageHeader } from "@/components/admin/ui";
import { DesignShowcase } from "./design-showcase";

export const metadata: Metadata = {
  title: "Sistema de diseño",
  robots: "noindex,nofollow",
};

/** Muestra de todos los componentes del sistema de diseño. Solo en desarrollo: en producción no existe. */
export default async function DesignShowcasePage() {
  if (process.env.NODE_ENV === "production") notFound();
  await requireAdminUser();
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Sistema de diseño" description="Cada componente en sus estados: normal, foco, error, deshabilitado y cargando." />
      <DesignShowcase />
    </div>
  );
}
