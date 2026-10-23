"use client";

import { createContext, useContext } from "react";

export interface StoriesOpener {
  /** Abre el visor en las historias de un tema; `origin` es la burbuja tocada (el visor crece desde ahí). */
  open: (topicId: string, origin: DOMRect) => void;
  /** Descarga el código del visor antes del toque (al acercar el dedo o el mouse). */
  prefetch: () => void;
}

/** Lo da StoriesLauncher; sin él, las burbujas son enlaces al feed del tema (nada se rompe). */
export const StoriesOpenContext = createContext<StoriesOpener | null>(null);

export function useStoriesOpener(): StoriesOpener | null {
  return useContext(StoriesOpenContext);
}
