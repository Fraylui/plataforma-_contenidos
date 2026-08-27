import Link from "next/link";
import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

/**
 * Estructura compartida por /privacidad y /terminos — mismo tratamiento
 * tipográfico que un artículo (font-serif, max-w-[70ch]) para que un
 * documento legal no se sienta como un cuerpo extraño dentro del sitio.
 * Índice como línea de enlaces envueltos, no una caja con recuadro y
 * numeración — se siente más liviano, sobre todo en mobile (ver memoria de
 * feedback de esta sesión: las páginas legales no debían sentirse como
 * documentación técnica).
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

      <h1 className="mt-3 font-serif text-2xl font-medium leading-tight text-foreground sm:text-3xl">{title}</h1>
      <p className="mt-1.5 text-sm text-muted">Última actualización: {updatedAt}</p>

      <nav aria-label="Contenido" className="mt-6 flex flex-wrap gap-x-2 gap-y-1 text-sm text-muted">
        {sections.map((section, index) => (
          <span key={section.id} className="flex items-center gap-2">
            <a href={`#${section.id}`} className="hover:text-accent hover:underline">
              {section.title}
            </a>
            {index < sections.length - 1 && <span aria-hidden="true">·</span>}
          </span>
        ))}
      </nav>

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-6">
            <h2 className="font-serif text-lg font-medium text-foreground">{section.title}</h2>
            <div className="mt-2 max-w-[70ch] space-y-3 text-base leading-relaxed text-foreground/90">
              {section.content}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
