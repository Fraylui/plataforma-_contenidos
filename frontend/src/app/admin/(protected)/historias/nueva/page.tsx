import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { canAccess } from "@/lib/admin/permissions";
import { listActiveCategoriesFresh } from "@/lib/api/admin/taxonomy";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, EmptyState } from "@/components/admin/ui";
import { StoryComposer } from "@/components/admin/stories/story-composer";

export const metadata: Metadata = {
  title: "Nueva historia",
  robots: "noindex,nofollow",
};

export default async function NewStoryPage() {
  const { user } = await requireAdminUser();
  if (!canAccess(user, "STORIES")) return <AccessDenied />;
  const categories = await listActiveCategoriesFresh();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AdminPageHeader title="Nueva historia" back={{ href: "/admin/historias", label: "Historias" }} />
      {categories.length === 0 ? (
        <EmptyState
          title="Primero crea un tema"
          description="Cada historia va en un tema: aparece en su burbuja del Inicio."
          action={{ href: "/admin/temas/nuevo", label: "Crear tema" }}
        />
      ) : (
        <StoryComposer categories={categories.map((category) => ({ id: category.id, name: category.name }))} />
      )}
    </div>
  );
}
