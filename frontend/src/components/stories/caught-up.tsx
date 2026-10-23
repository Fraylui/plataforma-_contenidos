import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react";
import type { HomeItem } from "@/lib/home-items";
import { GridTile } from "@/components/post/grid-tile";

/**
 * Final de las historias: en vez de cerrar a la nada, lo más reciente del
 * sitio para seguir (retención: la sesión termina en contenido). Navegar
 * desde aquí cierra el visor solo (StoriesLauncher lo cierra al cambiar de ruta).
 */
export function CaughtUp({ recent }: { recent: HomeItem[] }) {
  return (
    <section
      aria-label="Estás al día"
      className="flex h-full flex-col justify-center gap-5 overflow-y-auto bg-black px-5 py-10 text-white"
    >
      <div className="text-center">
        <CheckCircle weight="fill" className="mx-auto size-12 text-brand-from" aria-hidden="true" />
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Estás al día</h2>
        <p className="mt-1 text-sm text-white/75">Ya viste todas las historias. Mientras tanto, lo más reciente:</p>
      </div>
      {recent.length > 0 && (
        <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-card">
          {recent.slice(0, 6).map((item) => (
            <GridTile key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}
      <Link
        href="/explorar"
        className="mx-auto flex min-h-11 items-center rounded-full bg-white px-6 text-sm font-bold text-zinc-900 transition-transform active:scale-[0.97]"
      >
        Seguir explorando
      </Link>
    </section>
  );
}
