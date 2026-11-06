import type { Metadata } from "next";
import { Broadcast } from "@phosphor-icons/react/dist/ssr";
import { getFeed, getLiveNow, listUpcomingLive } from "@/lib/api/client";
import { fromFeedItem } from "@/lib/home-items";
import { KeepExploring } from "@/components/feed/keep-exploring";
import { LiveLabel } from "@/components/live/live-banner";
import { LivePlayer } from "@/components/live/live-player";
import { UpcomingLiveList } from "@/components/live/upcoming-live-list";
import { ShareButton } from "@/components/series/share-button";
import { orNull, orDefault } from "@/lib/server-log";

export const metadata: Metadata = {
  title: "En vivo",
  description: "Transmisiones en vivo y las próximas fechas.",
  alternates: { canonical: "/en-vivo" },
};

/** En vivo: la transmisión de ahora (video y chat de YouTube dentro del sitio) y las próximas. */
export default async function LivePage() {
  const [now, upcoming] = await Promise.all([getLiveNow().catch(orNull("en-vivo.ahora")), listUpcomingLive().catch(orDefault("en-vivo.proximas", []))]);
  // Ni en vivo ni próximas: se ofrece lo más reciente en vez de dejar la página vacía.
  const meanwhile = !now && upcoming.length === 0 ? (await getFeed({ size: 6 }).catch(orNull("en-vivo.recientes")))?.items.map(fromFeedItem) ?? [] : [];

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <h1 className="mb-5 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">En vivo</h1>
      {now ? (
        <article>
          <LivePlayer stream={now} />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <LiveLabel as="p" />
              <h2 className="mt-1 text-title font-bold text-foreground">{now.title}</h2>
              {now.description && <p className="mt-2 text-sm whitespace-pre-line text-muted">{now.description}</p>}
            </div>
            <ShareButton title={now.title} />
          </div>
        </article>
      ) : (
        <div className="flex items-center gap-3 rounded-card bg-surface px-5 py-4 shadow-card">
          <Broadcast weight="fill" className="size-6 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-foreground">No hay ninguna transmisión en vivo ahora</p>
            <p className="text-sm text-muted">
              {upcoming.length > 0 ? "Mira abajo cuándo es la próxima." : "Cuando empiece una, la verás aquí y en el inicio."}
            </p>
          </div>
        </div>
      )}
      <UpcomingLiveList streams={upcoming} />
      <KeepExploring items={meanwhile} />
    </div>
  );
}
