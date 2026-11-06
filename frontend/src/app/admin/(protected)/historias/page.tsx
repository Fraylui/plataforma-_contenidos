import type { Metadata } from "next";
import { requireAdminUser } from "@/lib/admin/auth";
import { listAdminStories } from "@/lib/api/admin/stories";
import { fetchOrAccessDenied } from "@/lib/admin/fetch-or-access-denied";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminPageHeader, ConfirmActionButton, EmptyState, ROW_ACTION_CLASS } from "@/components/admin/ui";
import { StoryGrid, StoryTabs, storyTabFromParam } from "@/components/admin/stories/story-grid";
import { deleteStoryAction, setStoryHighlightedAction } from "./actions";

export const metadata: Metadata = {
  title: "Historias",
  robots: "noindex,nofollow",
};

const EMPTY = {
  ACTIVE: { title: "No hay historias activas", description: "Sube fotos o un texto corto: se ven 24 h en el Inicio, en la burbuja de su tema." },
  HIGHLIGHTED: { title: "Todavía no hay Destacadas", description: "Guarda en Destacadas las historias que quieras dejar en la página de su tema." },
  ENDED: { title: "Ninguna terminó en los últimos 7 días", description: "Aquí quedan una semana con sus vistas y toques; después se borran solas." },
} as const;

export default async function AdminStoriesPage({ searchParams }: PageProps<"/admin/historias">) {
  const { accessToken } = await requireAdminUser();
  const { tab: tabParam } = await searchParams;
  const tab = storyTabFromParam(typeof tabParam === "string" ? tabParam : undefined);
  const result = await fetchOrAccessDenied(() => listAdminStories(accessToken, tab));
  if ("denied" in result) return <AccessDenied />;

  return (
    <div>
      <AdminPageHeader
        title="Historias"
        description="Fotos o textos cortos que se ven 24 h en el Inicio, en la burbuja de su tema. Las Destacadas se quedan en la página del tema."
        action={{ href: "/admin/historias/nueva", label: "Nueva historia" }}
      />
      <StoryTabs current={tab} />
      {result.data.length === 0 ? (
        <div className="mt-5">
          <EmptyState {...EMPTY[tab]} action={tab === "ACTIVE" ? { href: "/admin/historias/nueva", label: "Crear la primera" } : undefined} />
        </div>
      ) : (
        <StoryGrid
          stories={result.data}
          now={new Date()}
          renderActions={(story) => (
            <>
              <form action={setStoryHighlightedAction.bind(null, story.id, !story.highlighted)}>
                <button type="submit" className={ROW_ACTION_CLASS}>
                  {story.highlighted ? "Quitar de Destacadas" : "Destacar"}
                </button>
              </form>
              <ConfirmActionButton
                action={deleteStoryAction.bind(null, story.id)}
                label="Eliminar"
                title="¿Eliminar esta historia?"
                description="Deja de verse en el sitio. No se puede deshacer."
              />
            </>
          )}
        />
      )}
    </div>
  );
}
