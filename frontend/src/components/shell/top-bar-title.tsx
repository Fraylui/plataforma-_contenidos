"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { ShellBrand } from "./left-rail";
import { pageTitle } from "./page-title";

/**
 * Lado izquierdo de la franja superior: el nombre de la pantalla (y una
 * flecha para volver en los detalles), como el encabezado de X. En celular,
 * en el inicio va la marca (no hay riel donde verla).
 */
export function TopBarTitle({ brand }: { brand: ShellBrand }) {
  const pathname = usePathname();
  const { title, back } = pageTitle(pathname);
  const home = pathname === "/";

  return (
    <div className="flex min-w-0 items-center gap-1">
      {back && (
        <Link
          href={back}
          aria-label="Volver"
          className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-canvas-strong"
        >
          <ArrowLeft className="h-5 w-5" weight="bold" aria-hidden="true" />
        </Link>
      )}
      {home && (
        <Link href="/" className="flex min-w-0 items-center gap-2 lg:hidden">
          {brand.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- logo definido en Configuración, host arbitrario
            <img src={brand.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          )}
          <span className="truncate text-lg font-extrabold tracking-tight text-foreground">{brand.name}</span>
        </Link>
      )}
      <p className={cn("truncate text-lg font-extrabold tracking-tight text-foreground", home && "hidden lg:block")}>{title}</p>
    </div>
  );
}
