import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { LiveStream } from "@/lib/api/types";

/** Punto rojo que late, como el "EN VIVO" de YouTube o Instagram (quieto si el sistema pide menos movimiento). */
export function LiveDot() {
  return (
    <span className="relative flex size-2.5" aria-hidden="true">
      <span className="absolute inline-flex size-full rounded-full bg-live opacity-75 motion-safe:animate-ping" />
      <span className="relative inline-flex size-2.5 rounded-full bg-live" />
    </span>
  );
}

/** «En vivo ahora» con el punto que late: el mismo rótulo en el aviso del feed y en las páginas de En vivo. */
export function LiveLabel({ as: Tag = "span" }: { as?: "span" | "p" }) {
  return (
    <Tag className="flex items-center gap-2 text-xs font-bold tracking-wide text-live uppercase">
      <LiveDot />
      En vivo ahora
    </Tag>
  );
}

/** Aviso arriba del feed mientras hay una transmisión en vivo: lleva a /en-vivo. */
export function LiveBanner({ stream }: { stream: LiveStream }) {
  return (
    <Link
      href="/en-vivo"
      className="mb-3 flex items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-card transition-shadow hover:shadow-pop focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida por YouTube (i.ytimg.com) */}
      <img
        src={`https://i.ytimg.com/vi/${stream.youtubeVideoId}/mqdefault.jpg`}
        alt=""
        loading="lazy"
        decoding="async"
        className="aspect-video w-24 shrink-0 rounded-lg object-cover"
      />
      <span className="min-w-0 flex-1">
        <LiveLabel />
        <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">{stream.title}</span>
      </span>
      <CaretRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
    </Link>
  );
}
