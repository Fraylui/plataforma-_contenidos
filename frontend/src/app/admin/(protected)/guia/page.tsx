import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { AdminPageHeader } from "@/components/admin/ui";
import { ContentGuide } from "@/components/admin/guide/content-guide";

export const metadata: Metadata = {
  title: "Qué se puede publicar",
  robots: "noindex,nofollow",
};

/** Guía de contenido (cualquier usuario del panel): qué sí, qué no y por qué. */
export default async function ContentGuidePage() {
  await requireAdminUser();
  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader
        title="Qué se puede publicar"
        description="Lo que cabe en la plataforma y lo que no, con la ley o la regla que lo respalda."
      />
      <div className="mt-6">
        <ContentGuide />
      </div>
    </div>
  );
}
