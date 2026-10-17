import Link from "next/link";
import { Compass, House, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

const PILL =
  "inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors";

/** 404 con forma de pantalla de app: ícono, mensaje corto y a dónde ir (inicio, Explorar, buscar). */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-canvas-strong text-foreground">
        <Compass className="h-10 w-10" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-foreground">Esta página no existe</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">
        Puede que el enlace esté roto o que el contenido ya no esté publicado.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        <Link href="/" className={`${PILL} bg-accent-fill text-accent-foreground hover:opacity-90`}>
          <House className="h-4 w-4" weight="fill" aria-hidden="true" />
          Ir al inicio
        </Link>
        <Link href="/explorar" className={`${PILL} bg-canvas-strong text-foreground hover:bg-accent-soft hover:text-accent`}>
          <Compass className="h-4 w-4" aria-hidden="true" />
          Explorar
        </Link>
        <Link href="/buscar" className={`${PILL} bg-canvas-strong text-foreground hover:bg-accent-soft hover:text-accent`}>
          <MagnifyingGlass className="h-4 w-4" aria-hidden="true" />
          Buscar
        </Link>
      </div>
    </div>
  );
}
