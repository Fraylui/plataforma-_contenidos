"use client";

import { useEffect } from "react";
import type { FeedItemType } from "@/lib/api/types";

/**
 * Avisa una vez que se abrió la página de un contenido (visitas anónimas, sin
 * cookies: el backend descarta robots y recargas — ver api/views/route.ts).
 * No dibuja nada.
 */
export function ViewBeacon({ type, id }: { type: FeedItemType; id: string }) {
  useEffect(() => {
    const url = `/api/views?type=${type}&id=${encodeURIComponent(id)}`;
    try {
      if (navigator.sendBeacon?.(url)) return;
    } catch {
      // sigue con fetch
    }
    fetch(url, { method: "POST", keepalive: true }).catch(() => undefined);
  }, [type, id]);
  return null;
}
