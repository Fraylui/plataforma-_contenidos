import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeedScreen } from "@/components/feed/feed-screen";
import { getFeedMoods } from "@/lib/api/client";
import { moodFromSlug } from "@/lib/moods";

async function loadMood(slug: string) {
  const mood = moodFromSlug(slug);
  if (!mood) notFound();
  // Lo vacío no existe: un ánimo que nada provocó todavía no tiene pantalla.
  const available = await getFeedMoods().catch(() => [] as string[]);
  if (!available.includes(mood.key)) notFound();
  return mood;
}

export async function generateMetadata(props: PageProps<"/animo/[animo]">): Promise<Metadata> {
  const { animo } = await props.params;
  const mood = await loadMood(animo);
  return {
    title: mood.title,
    description: `${mood.label}: lo que más ${mood.key === "LOVE" ? "enamoró" : "provocó esa reacción"} a la gente.`,
    alternates: { canonical: `/animo/${mood.slug}` },
    // Cambia con cada reacción y repite posts que ya tienen su propia página: Google no la guarda (sí sigue los enlaces).
    robots: { index: false, follow: true },
  };
}

/**
 * «Según cómo te quieres sentir»: el feed ordenado por las reacciones que
 * dejó la gente (lo que más hizo reír, sorprendió, inspiró o enamoró). El
 * mismo feed del inicio con el chip del ánimo activo.
 */
export default async function MoodPage(props: PageProps<"/animo/[animo]">) {
  const { animo } = await props.params;
  const mood = await loadMood(animo);
  return (
    <FeedScreen
      heading={mood.title}
      filter={{ mood: mood.key }}
      activePath={`/animo/${mood.slug}`}
      adSection="HOME"
      emptyMessage="Todavía nada provocó esta reacción."
    />
  );
}
