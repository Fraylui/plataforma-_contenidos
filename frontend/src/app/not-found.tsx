import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Compass className="h-8 w-8" aria-hidden="true" />
      </div>
      <p className="mt-6 text-sm font-bold tracking-[0.2em] text-accent uppercase">Error 404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        No encontramos esta página
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        El contenido pudo haberse movido, no existir o no estar publicado todavía.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-colors hover:opacity-90"
        >
          Volver al inicio
        </Link>
        <Link
          href="/publicaciones"
          className="inline-flex items-center gap-1.5 rounded-full border border-foreground/[0.08] bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-accent/50 hover:text-accent"
        >
          Ver publicaciones
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
