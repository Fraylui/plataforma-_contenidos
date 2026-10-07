import type { ReactNode } from "react";

export interface LegalSection {
  id: string;
  title: string;
  content: ReactNode;
}

/**
 * Páginas de información (Contacto, Privacidad, Términos) con forma de
 * pantalla de app, como la ayuda de Instagram o Facebook: título, fecha de
 * actualización, accesos a cada sección como chips y el texto en una
 * superficie blanca de lectura cómoda (70 caracteres). Sin ruta visible ni
 * bordes.
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
    <article className="mx-auto w-full max-w-[680px] py-4 sm:px-4 sm:py-6">
      <header className="px-4 sm:px-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted">Actualizado el {updatedAt}</p>
      </header>

      {sections.length > 1 && (
        <nav aria-label="Secciones de la página" className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4 sm:px-0">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="inline-flex min-h-9 shrink-0 items-center rounded-full bg-canvas-strong px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent-soft hover:text-accent"
            >
              {section.title}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-4 space-y-8 bg-surface px-4 py-6 sm:rounded-2xl sm:px-6">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-20">
            <h2 className="text-[17px] font-bold text-foreground">{section.title}</h2>
            <div className="mt-2 max-w-[70ch] space-y-3 text-[15px] leading-relaxed text-foreground/90">{section.content}</div>
          </section>
        ))}
      </div>
    </article>
  );
}
