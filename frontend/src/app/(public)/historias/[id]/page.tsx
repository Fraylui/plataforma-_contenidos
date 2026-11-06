import type { Metadata } from "next";
import { getFeed, getStory, NotFoundError } from "@/lib/api/client";
import { fromFeedItem } from "@/lib/home-items";
import { imageUrl } from "@/lib/image-url";
import { serverImageUrl } from "@/lib/server-image-url";
import { orDefault } from "@/lib/server-log";
import { SharedStory } from "@/components/stories/shared-story";
import { StoryEnded } from "@/components/stories/story-ended";

/** Efímera: no se indexa ni entra al sitemap (el valor para Google está en el contenido al que lleva). */
const ROBOTS = "noindex,follow";

async function load(id: string) {
  try {
    return await getStory(id);
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/historias/[id]">): Promise<Metadata> {
  const { id } = await params;
  const detail = await load(id);
  if (!detail) return { title: "Historia", robots: ROBOTS };
  const { story, category } = detail;
  return {
    title: story.caption ?? `Historia de ${category.name}`,
    description: `Historia de ${category.name}.`,
    robots: ROBOTS,
    alternates: { canonical: `/historias/${id}` },
    // Vista previa al compartir por WhatsApp: la foto de la historia (URL pública, no la interna del backend).
    openGraph: story.imageId ? { images: [imageUrl(`/api/v1/images/${story.imageId}/file`)] } : undefined,
  };
}

/** Enlace compartido a una historia: se abre en el visor; si ya caducó, lo dice y ofrece seguir. */
export default async function StoryPage({ params }: PageProps<"/historias/[id]">) {
  const { id } = await params;
  const [detail, feed] = await Promise.all([
    load(id),
    getFeed({ size: 6 }).catch(orDefault("historia.reciente", { items: [], hasMore: false })),
  ]);
  const recent = feed.items.map(fromFeedItem);
  if (!detail) return <StoryEnded recent={recent} />;

  const { story, category } = detail;
  const imageSrc = story.imageId ? { [story.id]: serverImageUrl(`/api/v1/images/${story.imageId}/file`) } : {};
  return (
    <>
      <h1 className="sr-only">{story.caption ?? `Historia de ${category.name}`}</h1>
      <SharedStory topic={{ category, latestAt: story.publishedAt, stories: [story] }} imageSrc={imageSrc} recent={recent} />
    </>
  );
}
