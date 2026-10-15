import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLiveBySlug, NotFoundError } from "@/lib/api/client";
import { formatEventDateTime } from "@/lib/content-labels";
import { LiveDot } from "@/components/live/live-banner";
import { LivePlayer } from "@/components/live/live-player";
import { ShareButton } from "@/components/series/share-button";

async function load(slug: string) {
  try {
    return await getLiveBySlug(slug);
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps<"/en-vivo/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const stream = await load(slug);
  return {
    title: stream.title,
    description: stream.description ?? "Transmisión en vivo.",
    alternates: { canonical: `/en-vivo/${stream.slug}` },
    openGraph: { images: [`https://i.ytimg.com/vi/${stream.youtubeVideoId}/hqdefault.jpg`] },
  };
}

/** Una transmisión: programada (cuándo empieza), en vivo (video + chat) o terminada (la repetición, en YouTube). */
export default async function LiveStreamPage({ params }: PageProps<"/en-vivo/[slug]">) {
  const { slug } = await params;
  const stream = await load(slug);

  return (
    <article className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <LivePlayer stream={stream} />
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {stream.status === "LIVE" && (
            <p className="flex items-center gap-2 text-xs font-bold tracking-wide text-red-600 uppercase dark:text-red-400">
              <LiveDot />
              En vivo ahora
            </p>
          )}
          {stream.status === "SCHEDULED" && (
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">
              {stream.scheduledStart ? `Empieza ${formatEventDateTime(stream.scheduledStart)}` : "Muy pronto"}
            </p>
          )}
          {stream.status === "ENDED" && (
            <p className="text-xs font-semibold tracking-wide text-muted uppercase">Terminó · mira la repetición</p>
          )}
          <h1 className="mt-1 text-title font-bold text-foreground">{stream.title}</h1>
          {stream.description && <p className="mt-2 text-sm whitespace-pre-line text-muted">{stream.description}</p>}
        </div>
        <ShareButton title={stream.title} />
      </div>
    </article>
  );
}
