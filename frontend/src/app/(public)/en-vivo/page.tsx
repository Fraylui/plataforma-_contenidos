import type { Metadata } from "next";
import { Broadcast } from "@phosphor-icons/react/dist/ssr";
import { getLiveNow, listUpcomingLive } from "@/lib/api/client";
import { LiveLabel } from "@/components/live/live-banner";
import { LivePlayer } from "@/components/live/live-player";
import { UpcomingLiveList } from "@/components/live/upcoming-live-list";
import { ShareButton } from "@/components/series/share-button";

export const metadata: Metadata = {
  title: "En vivo",
  description: "Transmisiones en vivo y las próximas fechas.",
  alternates: { canonical: "/en-vivo" },
};

/** En vivo: la transmisión de ahora (video y chat de YouTube dentro del sitio) y las próximas. */
export default async function LivePage() {
  const [now, upcoming] = await Promise.all([getLiveNow().catch(() => null), listUpcomingLive().catch(() => [])]);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6">
      <h1 className="sr-only">En vivo</h1>
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
        <div className="flex flex-col items-center gap-2 rounded-card bg-surface px-6 py-14 text-center shadow-card">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Broadcast weight="fill" className="size-6" aria-hidden="true" />
          </span>
          <p className="text-base font-semibold text-foreground">No hay ninguna transmisión en vivo ahora</p>
          <p className="max-w-sm text-sm text-muted">
            {upcoming.length > 0 ? "Mira abajo cuándo es la próxima." : "Cuando empiece una, la verás aquí y en el inicio."}
          </p>
        </div>
      )}
      <UpcomingLiveList streams={upcoming} />
    </div>
  );
}
