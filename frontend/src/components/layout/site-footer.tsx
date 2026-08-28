import Link from "next/link";
import { getPlatformSettings } from "@/lib/api/client";

export async function SiteFooter() {
  const settings = await getPlatformSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <nav aria-label="Explorar" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/articulos" className="text-muted hover:text-foreground hover:underline">
            Artículos
          </Link>
          <Link href="/lugares" className="text-muted hover:text-foreground hover:underline">
            Lugares
          </Link>
          <Link href="/eventos" className="text-muted hover:text-foreground hover:underline">
            Eventos
          </Link>
          <Link href="/galerias" className="text-muted hover:text-foreground hover:underline">
            Galerías
          </Link>
          <Link href="/resenas" className="text-muted hover:text-foreground hover:underline">
            Reseñas
          </Link>
          <Link href="/directorio" className="text-muted hover:text-foreground hover:underline">
            Directorio
          </Link>
          <Link href="/categorias" className="text-muted hover:text-foreground hover:underline">
            Categorías
          </Link>
        </nav>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.name}. Contenido publicado bajo revisión editorial.
          </p>
          <nav aria-label="Legal" className="flex items-center gap-4">
            <Link href="/privacidad" className="hover:text-foreground hover:underline">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-foreground hover:underline">
              Términos
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
