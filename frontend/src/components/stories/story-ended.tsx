import Link from "next/link";
import { Hourglass } from "@phosphor-icons/react/dist/ssr";
import type { HomeItem } from "@/lib/home-items";
import { GridTile } from "@/components/post/grid-tile";

/**
 * Un enlace compartido a una historia que ya caducó: en vez de un 404 frío,
 * lo dice y ofrece seguir (quien llega por WhatsApp no sabe que duraba 24 h).
 */
export function StoryEnded({ recent }: { recent: HomeItem[] }) {
  return (
    <section className="mx-auto flex w-full max-w-[630px] flex-col items-center gap-5 px-4 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Hourglass weight="duotone" className="size-8" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Esta historia ya terminó</h1>
        <p className="mt-1 text-[15px] text-muted">Las historias se ven 24 horas. Mira lo más reciente del sitio:</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/" className="flex min-h-11 items-center rounded-full bg-accent-fill px-5 text-sm font-bold text-accent-foreground transition-transform active:scale-[0.97]">
          Ir al inicio
        </Link>
        <Link href="/explorar" className="flex min-h-11 items-center rounded-full bg-canvas-strong px-5 text-sm font-bold text-foreground transition-transform active:scale-[0.97]">
          Explorar
        </Link>
      </div>
      {recent.length > 0 && (
        <div className="grid w-full grid-cols-3 gap-1 overflow-hidden rounded-card">
          {recent.slice(0, 6).map((item) => (
            <GridTile key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
