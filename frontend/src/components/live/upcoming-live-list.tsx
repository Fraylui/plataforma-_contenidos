import Link from "next/link";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import type { LiveStream } from "@/lib/api/types";
import { formatEventDateTime } from "@/lib/content-labels";

/** Próximas transmisiones, con fecha y hora absolutas (como Celebraciones). */
export function UpcomingLiveList({ streams }: { streams: LiveStream[] }) {
  if (streams.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold text-foreground">Próximas transmisiones</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {streams.map((stream) => (
          <li key={stream.id}>
            <Link
              href={`/en-vivo/${stream.slug}`}
              className="flex gap-3 rounded-card bg-surface p-3 shadow-card transition-shadow hover:shadow-pop focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida por YouTube (i.ytimg.com) */}
              <img
                src={`https://i.ytimg.com/vi/${stream.youtubeVideoId}/mqdefault.jpg`}
                alt=""
                loading="lazy"
                className="aspect-video w-28 shrink-0 rounded-lg bg-canvas-strong object-cover"
              />
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm font-semibold text-foreground">{stream.title}</span>
                <span className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <CalendarBlank className="size-3.5" aria-hidden="true" />
                  {stream.scheduledStart ? formatEventDateTime(stream.scheduledStart) : "Muy pronto"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
