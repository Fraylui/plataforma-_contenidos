import Link from "next/link";
import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

/**
 * Estructura compartida por /privacidad y /terminos — mismo tratamiento
 * tipográfico que un artículo (font-serif para título, max-w-[70ch] para
 * el cuerpo, ver app/articulos/[slug]/page.tsx) para que un documento legal
 * no se sienta como un cuerpo extraño dentro del sitio editorial. La tabla
 * de contenidos (en vez de un muro de texto sin puntos de referencia) es lo
 * que más diferencia esto de una página legal genérica.
 */
export function LegalPageLayout({
  title,
  updatedAt,
  sections,
}: {
  title: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent hover:underline">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground/80" aria-current="page">
            {title}
          </li>
        </ol>
      </nav>

      <h1 className="mt-3 font-serif text-3xl font-medium leading-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted">Última actualización: {updatedAt}</p>

      <nav aria-label="Tabla de contenidos" className="mt-8 rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">En esta página</p>
        <ol className="mt-3 space-y-1.5 text-sm">
          {sections.map((section, index) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="text-foreground hover:text-accent hover:underline">
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-6">
            <h2 className="font-serif text-xl font-medium text-foreground">
              {index + 1}. {section.title}
            </h2>
            <div className="mt-3 max-w-[70ch] space-y-3 text-base leading-relaxed text-foreground/90">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
