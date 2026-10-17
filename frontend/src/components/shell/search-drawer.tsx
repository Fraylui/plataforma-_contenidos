"use client";

import { cloneElement, Suspense, useRef, useState, type ReactElement, type Ref } from "react";
import { lazyPopup } from "./lazy-popup";

const { Component: SearchDrawerPanel, preload } = lazyPopup(() => import("./search-drawer-panel"));

type TriggerProps = {
  ref?: Ref<HTMLButtonElement>;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onFocus?: () => void;
  "aria-haspopup"?: "dialog";
  "aria-expanded"?: boolean;
};

/**
 * Panel lateral de búsqueda del riel (escritorio), como "Buscar" en
 * Instagram. El botón queda siempre en su lugar; el panel (Radix Dialog) se
 * carga al primer toque (ver lazy-popup.ts) y al cerrarse devuelve el foco
 * a este botón.
 */
export function SearchDrawer({
  categoryNames,
  trigger,
}: {
  categoryNames: Record<string, string>;
  /** Botón del riel que lo abre (lleva su propio estilo). */
  trigger: ReactElement<TriggerProps>;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {cloneElement(trigger, {
        ref: buttonRef,
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        onClick: () => {
          setMounted(true);
          setOpen(true);
        },
        onPointerEnter: preload,
        onFocus: preload,
      })}
      {mounted && (
        <Suspense fallback={null}>
          <SearchDrawerPanel
            categoryNames={categoryNames}
            open={open}
            onOpenChange={setOpen}
            onClosed={() => buttonRef.current?.focus()}
          />
        </Suspense>
      )}
    </>
  );
}
