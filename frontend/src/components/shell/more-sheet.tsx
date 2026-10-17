"use client";

import { Suspense, useRef, useState } from "react";
import { DotsThreeCircle } from "@phosphor-icons/react";
import { lazyPopup } from "./lazy-popup";

const { Component: MoreSheetPanel, preload } = lazyPopup(() => import("./more-sheet-panel"));

/**
 * «Más» de la barra inferior (celular): hoja con Celebraciones y los enlaces
 * legales. El botón queda siempre en su lugar; la hoja (Radix Dialog) se
 * carga al primer toque (ver lazy-popup.ts) y al cerrarse le devuelve el foco.
 */
export function MoreSheet({ triggerClassName }: { triggerClassName: string }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={triggerClassName}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        onPointerDown={preload}
        onFocus={preload}
      >
        <DotsThreeCircle className="h-6 w-6" aria-hidden="true" />
        <span className="text-[11px] font-medium">Más</span>
      </button>
      {mounted && (
        <Suspense fallback={null}>
          <MoreSheetPanel open={open} onOpenChange={setOpen} onClosed={() => buttonRef.current?.focus()} />
        </Suspense>
      )}
    </>
  );
}
