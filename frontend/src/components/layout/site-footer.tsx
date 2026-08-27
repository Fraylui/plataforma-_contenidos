import Link from "next/link";
import { getPlatformSettings } from "@/lib/api/client";

export async function SiteFooter() {
  const settings = await getPlatformSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
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
    </footer>
  );
}
