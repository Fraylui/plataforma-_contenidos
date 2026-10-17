import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { canAccess } from "@/lib/admin/permissions";
import { listActiveCategoriesFresh } from "@/lib/api/admin-client";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { SeriesCreateForm } from "@/components/admin/series-create-form";

export const metadata: Metadata = {
  title: "Nueva serie",
  robots: "noindex,nofollow",
};

export default async function NewSeriesPage() {
  const { user } = await requireAdminUser();
  if (!canAccess(user, "SERIES")) return <AccessDenied />;
  const categories = await listActiveCategoriesFresh();

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Nueva serie" back={{ href: "/admin/series", label: "Series" }} />
      {categories.length === 0 ? (
        <EmptyState
          title="Primero crea un tema"
          description="Cada serie va en un tema (Curiosidades, Historia, Animales…)."
          action={{ href: "/admin/temas/nuevo", label: "Crear tema" }}
        />
      ) : (
        <SeriesCreateForm categories={categories} />
      )}
    </div>
  );
}
