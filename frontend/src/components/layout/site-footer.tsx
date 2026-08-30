import Link from "next/link";
import { getPlatformSettings } from "@/lib/api/client";

export async function SiteFooter() {
  const settings = await getPlatformSettings();
  const year = new Date().getFullYear();
  return (
    <footer
      className="text-background"
      style={
        {
          background:
            "radial-gradient(130% 200% at 0% 100%, var(--accent) 0%, transparent 40%), " +
            "radial-gradient(100% 160% at 100% 0%, rgba(255,255,255,0.04) 0%, transparent 55%), " +
            "#0d0d0d",
          "--background": "#f5f5f5",
          "--foreground": "#0d0d0d",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 text-sm text-background/75 sm:flex-row sm:items-center sm:justify-between">
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
