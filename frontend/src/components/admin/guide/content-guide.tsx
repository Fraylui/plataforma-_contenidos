import Link from "next/link";
import { CheckCircle, Scales, XCircle } from "@phosphor-icons/react/dist/ssr";
import { CONTENT_GUIDE, GUIDE_DISCLAIMER } from "@/lib/admin/content-guide";

/** Página «Qué se puede publicar»: cada regla con lo que sí, lo que no y su respaldo. */
export function ContentGuide() {
  return (
    <div className="space-y-4">
      {CONTENT_GUIDE.map((rule, index) => (
        <section key={rule.title} aria-labelledby={`guia-${index}`} className="rounded-card bg-surface p-5 shadow-card sm:p-6">
          <h2 id={`guia-${index}`} className="text-lg font-bold tracking-tight text-foreground">
            {rule.title}
          </h2>
          {rule.basis && (
            <p className="mt-1 flex items-start gap-1.5 text-sm text-muted">
              <Scales aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {rule.basis}
            </p>
          )}
          <ul className="mt-4 space-y-2.5">
            {rule.no?.map((text) => (
              <li key={text} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
                <XCircle weight="fill" aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger-ink" />
                <span>
                  <span className="sr-only">No: </span>
                  {text}
                </span>
              </li>
            ))}
            {rule.yes?.map((text) => (
              <li key={text} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground">
                <CheckCircle weight="fill" aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" />
                <span>
                  <span className="sr-only">Sí: </span>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="px-1 text-xs text-muted">{GUIDE_DISCLAIMER}</p>
    </div>
  );
}

/**
 * Lo esencial en cada compositor, al lado de Publicar: las dos reglas que más
 * se rompen sin querer y el enlace a la guía completa.
 */
export function PublishRulesCard() {
  return (
    <section aria-labelledby="antes-de-publicar" className="rounded-card bg-surface p-5 text-sm shadow-card">
      <h2 id="antes-de-publicar" className="text-base font-semibold text-foreground">
        Antes de publicar
      </h2>
      <ul className="mt-3 space-y-2.5 text-foreground">
        <li className="flex items-start gap-2">
          <XCircle weight="fill" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger-ink" />
          Nada que promocione un negocio gratis: ni precios, ni ofertas, ni contactos.
        </li>
        <li className="flex items-start gap-2">
          <XCircle weight="fill" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger-ink" />
          <span>
            <strong className="font-semibold">¿Te pagaron o te dieron algo a cambio</strong> (entradas, canje, un descuento)? Es publicidad
            y sale como «Patrocinado».{" "}
            <Link href="/admin/anunciantes" className="font-semibold text-accent underline underline-offset-2">
              Crear un anuncio
            </Link>
          </span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle weight="fill" aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
          Fotos y videos tuyos o con permiso; nada de datos personales de otros.
        </li>
      </ul>
      <Link href="/admin/guia" className="mt-4 inline-flex text-sm font-semibold text-accent underline-offset-2 hover:underline">
        Ver la guía completa
      </Link>
    </section>
  );
}
