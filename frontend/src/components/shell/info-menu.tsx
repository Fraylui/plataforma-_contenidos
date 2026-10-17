"use client";

import { Suspense, useState, type ReactNode } from "react";
import { Info } from "@phosphor-icons/react";
import { lazyPopup } from "./lazy-popup";

const { Component: InfoMenuPanel, preload } = lazyPopup(() => import("./info-menu-panel"));

/**
 * «Información» del riel en modo íconos (1024–1279 px): enlaces legales. El
 * menú (Radix DropdownMenu) se carga al primer toque: ver lazy-popup.ts.
 */
export function InfoMenu({ brandName, triggerClassName, children }: { brandName: string; triggerClassName: string; children?: ReactNode }) {
  const [active, setActive] = useState(false);
  const idle = (
    <button
      type="button"
      aria-label="Información"
      aria-haspopup="menu"
      className={triggerClassName}
      onClick={() => setActive(true)}
      onPointerEnter={preload}
      onFocus={preload}
    >
      <Info className="h-6 w-6 shrink-0" aria-hidden="true" />
      {children}
    </button>
  );
  if (!active) return idle;
  return (
    <Suspense fallback={idle}>
      <InfoMenuPanel brandName={brandName} triggerClassName={triggerClassName}>
        {children}
      </InfoMenuPanel>
    </Suspense>
  );
}
