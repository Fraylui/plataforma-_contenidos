"use client";

import { useEffect, type RefObject } from "react";

/** Estándar MRC/IAB de impresión visible para display: 50 % de los píxeles en pantalla durante 1 s seguido. */
export const VIEWABLE_RATIO = 0.5;
export const VIEWABLE_MS = 1000;

/**
 * Avisa al servidor (una vez por montaje) cuando el anuncio se vio de
 * verdad. Antes la impresión se contaba al pedir la campaña, aunque el
 * visitante nunca bajara hasta ella: las cifras que se le reportan al
 * anunciante quedaban infladas. Con la pestaña oculta el reloj no corre.
 *
 * sendBeacon sobrevive a que el visitante cierre o cambie de página justo
 * después del segundo; si no existe, fetch con keepalive hace lo mismo.
 */
export function useViewableImpression(ref: RefObject<HTMLElement | null>, campaignId: string) {
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let visible = false;
    let done = false;

    const stop = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const start = () => {
      if (done || timer || !visible || document.visibilityState !== "visible") return;
      timer = setTimeout(() => {
        done = true;
        observer.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        report(campaignId);
      }, VIEWABLE_MS);
    };
    function onVisibility() {
      if (document.visibilityState === "visible") start();
      else stop();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= VIEWABLE_RATIO);
        if (visible) start();
        else stop();
      },
      { threshold: [0, VIEWABLE_RATIO] },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref, campaignId]);
}

function report(campaignId: string) {
  const url = `/api/ads/impression?id=${encodeURIComponent(campaignId)}`;
  try {
    if (navigator.sendBeacon?.(url)) return;
  } catch {
    // sigue con fetch
  }
  fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
}
