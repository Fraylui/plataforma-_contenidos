"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCookieConsent, setCookieConsent, subscribeToCookieConsent } from "@/lib/cookie-consent";

const getServerSnapshot = () => null;

export function CookieConsentBanner({ adsenseEnabled }: { adsenseEnabled: boolean }) {
  const pathname = usePathname();
  // null tanto en el servidor (sin localStorage) como en el cliente antes
  // de decidir — React reconcilia la diferencia servidor↔cliente sola acá,
  // sin el warning de hidratación que daría un useState+useEffect manual.
  const consent = useSyncExternalStore(subscribeToCookieConsent, getCookieConsent, getServerSnapshot);

  // El panel admin (herramienta interna, sin AdSense) no necesita este
  // aviso — RootLayout envuelve /admin igual que el resto (ver memoria
  // "frontend-nextjs16-gotchas"), así que se filtra acá, no en el layout.
  if (pathname?.startsWith("/admin")) return null;
  if (consent !== null) return null;

  return (
    <>
      {/* Reserva el espacio que ocupa el banner fijo: sin esto, tapa el
          footer (links Privacidad/Términos quedaban inalcanzables mientras
          el banner estaba visible — encontrado al revisar la página real). */}
      <div aria-hidden="true" className="h-[64px]" />
      {/* Compacto (2026-11): antes ocupaba casi media pantalla del celular en
          la primera visita. Una franja, texto corto y los dos botones del
          mismo tamaño (rechazar tan fácil como aceptar). */}
      <div
        role="region"
        aria-label="Aviso de cookies"
        // En escritorio empieza después del menú lateral (como el anuncio fijo): no tapa «Información» ni los enlaces legales.
        className="fixed inset-x-0 bottom-(--bottom-bar-h) z-50 border-t border-border bg-surface/95 px-3 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur sm:px-6 lg:left-[76px] xl:left-[17.5rem]"
      >
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <p className="min-w-0 flex-1 text-xs leading-snug text-muted">
            {adsenseEnabled ? "Cookies necesarias y, si aceptas, de Google para anuncios." : "Solo usamos cookies necesarias."}{" "}
            {/* Texto que se entiende fuera de contexto (Lighthouse: link-text). */}
            <Link href="/privacidad" className="whitespace-nowrap text-foreground underline underline-offset-2 hover:text-accent">
              Política de cookies
            </Link>
          </p>
          <div className="flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setCookieConsent("rejected")}
              className="min-h-9 cursor-pointer rounded-full border border-foreground/[0.08] px-3 text-xs font-semibold text-foreground transition-colors hover:border-accent/50 hover:text-accent"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => setCookieConsent("accepted")}
              className="min-h-9 cursor-pointer rounded-full bg-accent-fill px-3 text-xs font-semibold text-accent-foreground transition-colors hover:opacity-90"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
