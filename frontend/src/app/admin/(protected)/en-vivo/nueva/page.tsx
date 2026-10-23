import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { canAccess } from "@/lib/admin/permissions";
import { listAdminSeries } from "@/lib/api/admin/series";
import { listActiveCategoriesFresh } from "@/lib/api/admin/taxonomy";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { LiveForm } from "@/components/admin/live-form";

export const metadata: Metadata = {
  title: "Programar transmisión",
  robots: "noindex,nofollow",
};

export default async function NewLivePage() {
  const { user, accessToken } = await requireAdminUser();
  if (!canAccess(user, "SERIES")) return <AccessDenied />;
  const [categories, series] = await Promise.all([
    listActiveCategoriesFresh(),
    listAdminSeries(accessToken, { page: 0 }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Programar transmisión" back={{ href: "/admin/en-vivo", label: "En vivo" }} />
      {categories.length === 0 ? (
        <EmptyState
          title="Primero crea un tema"
          description="Cada transmisión va en un tema (Curiosidades, Historia, Animales…)."
          action={{ href: "/admin/temas/nuevo", label: "Crear tema" }}
        />
      ) : (
        <LiveForm categories={categories} series={series.items} />
      )}
    </div>
  );
}
