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
      <div aria-hidden="true" className="h-[124px] sm:h-[68px]" />
      <div
        role="region"
        aria-label="Aviso de cookies"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:px-6"
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {adsenseEnabled
              ? "Usamos cookies técnicas necesarias y, si aceptás, cookies de terceros (Google) para mostrar publicidad."
              : "Usamos cookies técnicas necesarias para el funcionamiento del sitio. Si en el futuro sumamos publicidad o analítica de terceros, te lo vamos a preguntar de nuevo."}{" "}
            <Link href="/privacidad" className="text-foreground underline underline-offset-2 hover:text-accent">
              Más información
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setCookieConsent("rejected")}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-background cursor-pointer"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={() => setCookieConsent("accepted")}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 cursor-pointer"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
