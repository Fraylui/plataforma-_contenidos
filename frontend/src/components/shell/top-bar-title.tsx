"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { BrandLogo } from "./brand-logo";
import type { ShellBrand } from "./left-rail";
import { backHref } from "./page-title";

/**
 * Lado izquierdo de la franja superior: la flecha para volver (en detalles)
 * y, en el celular, la marca, como el encabezado de Instagram o TikTok. Sin
 * el nombre de la pantalla: en escritorio el riel ya muestra dónde estás.
 */
export function TopBarTitle({ brand }: { brand: ShellBrand }) {
  const back = backHref(usePathname());

  return (
    <div className="flex min-w-0 items-center gap-1">
      {back && (
        <Link
          href={back}
          aria-label="Volver"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-canvas-strong"
        >
          <ArrowLeft className="h-5 w-5" weight="bold" aria-hidden="true" />
        </Link>
      )}
      <Link href="/" className="flex min-w-0 items-center gap-2 lg:hidden">
        {brand.logoUrl && (
          <BrandLogo logoUrl={brand.logoUrl} logoDarkUrl={brand.logoDarkUrl} className="h-8 w-8 shrink-0 rounded-lg object-cover" />
        )}
        <span className="truncate text-lg font-extrabold tracking-tight text-foreground">{brand.name}</span>
      </Link>
    </div>
  );
}
