"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ActiveTopic } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { StoriesOpenContext, type StoriesOpener } from "./stories-context";
import type { CloseReason } from "./story-viewer";

/** El visor no entra en el JavaScript inicial del Inicio: se descarga al acercarse a una burbuja o al tocarla. */
const StoryViewer = dynamic(() => import("./story-viewer").then((mod) => mod.StoryViewer), { ssr: false });

function prefetchViewer() {
  void import("./story-viewer");
}

interface OpenState {
  topicId: string;
  origin: { x: number; y: number };
  pathname: string;
}

/**
 * Conecta las burbujas de la fila con el visor. Al abrir agrega
 * `?historia=` al historial (Atrás o el gesto de Android lo cierran); si la
 * página cambia (se tocó un enlace), se cierra solo; al cerrar, el foco
 * vuelve a la burbuja tocada.
 */
export function StoriesLauncher({
  topics,
  imageSrc,
  recent,
  children,
}: {
  topics: ActiveTopic[];
  imageSrc: Record<string, string>;
  recent: HomeItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [openState, setOpenState] = useState<OpenState | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const open = useCallback(
    (topicId: string, rect: DOMRect) => {
      const first = topics.find((topic) => topic.category.id === topicId)?.stories[0];
      if (!first) return;
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const url = new URL(window.location.href);
      url.searchParams.set("historia", first.id);
      window.history.pushState({ historia: first.id }, "", url.toString());
      setOpenState({ topicId, origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }, pathname });
    },
    [topics, pathname],
  );

  const close = useCallback((reason: CloseReason = "user") => {
    setOpenState(null);
    // Cerrado con el botón o el gesto: se quita la entrada ?historia= que agregamos. Con Atrás ya se quitó.
    if (reason === "user") window.history.back();
  }, []);

  const opener: StoriesOpener = useMemo(() => ({ open, prefetch: prefetchViewer }), [open]);
  // Se tocó un enlace dentro del visor (la píldora, «Lo más reciente»): la página nueva ya no lo muestra,
  // y al volver con Atrás tampoco se reabre (el estado se descarta durante el render, no en un efecto).
  if (openState !== null && openState.pathname !== pathname) {
    setOpenState(null);
  }
  const visible = openState !== null && openState.pathname === pathname;

  // El foco vuelve a la burbuja cuando el diálogo ya se desmontó (si se devuelve antes, Radix lo vuelve a mover).
  useEffect(() => {
    if (visible || !returnFocus.current) return;
    const target = returnFocus.current;
    returnFocus.current = null;
    // Si se navegó a otra página, la burbuja ya no está: no hay a dónde volver.
    const frame = requestAnimationFrame(() => {
      if (target.isConnected) target.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <StoriesOpenContext.Provider value={opener}>
      {children}
      {visible && (
        <StoryViewer
          topics={topics}
          startTopicId={openState.topicId}
          origin={openState.origin}
          onClose={close}
          recent={recent}
          imageSrc={imageSrc}
        />
      )}
    </StoriesOpenContext.Provider>
  );
}
