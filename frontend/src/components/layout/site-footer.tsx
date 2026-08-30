import Link from "next/link";
import { getPlatformSettings } from "@/lib/api/client";

export async function SiteFooter() {
  const settings = await getPlatformSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {(settings.logoDarkUrl || settings.logoUrl) && (
              // eslint-disable-next-line @next/next/no-img-element -- URL de logo definida por el usuario en Configuración, host arbitrario
              <img src={settings.logoDarkUrl || settings.logoUrl!} alt={settings.name} className="h-6 w-auto" />
            )}
            <p>
              © {year} {settings.name}. Todos los derechos reservados.
            </p>
          </div>
          <nav aria-label="Legal" className="flex items-center gap-4">
            <Link href="/privacidad" className="transition-colors hover:text-accent hover:underline">
              Privacidad
            </Link>
            <Link href="/terminos" className="transition-colors hover:text-accent hover:underline">
              Términos
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
