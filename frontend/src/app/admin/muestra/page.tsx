import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/ui";
import { DesignShowcase } from "./design-showcase";

export const metadata: Metadata = {
  title: "Sistema de diseño",
  robots: "noindex,nofollow",
};

/**
 * Muestra de todos los componentes del sistema de diseño. Solo en
 * desarrollo (en producción no existe) y sin datos: por eso vive fuera de
 * (protected) y no pide sesión.
 */
export default function DesignShowcasePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <AdminPageHeader title="Sistema de diseño" description="Cada componente en sus estados: normal, foco, error, deshabilitado y cargando." />
      <DesignShowcase />
    </main>
  );
}
