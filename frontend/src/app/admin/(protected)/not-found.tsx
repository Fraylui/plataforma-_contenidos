import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { buttonClass } from "@/components/ui";

/** 404 dentro del panel: algo que ya no existe (borrado, archivado o un enlace viejo). */
export default function AdminNotFound() {
  return (
    <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-3 rounded-card bg-surface px-6 py-12 text-center shadow-card">
      <span className="flex size-12 items-center justify-center rounded-full bg-field text-muted">
        <MagnifyingGlass weight="bold" aria-hidden="true" className="size-6" />
      </span>
      <h1 className="text-lg font-bold text-foreground">No encontramos esto</h1>
      <p className="text-sm text-muted">Puede que se haya borrado o que el enlace esté mal. Usa el buscador (Ctrl K) o vuelve al inicio.</p>
      <Link href="/admin" className={buttonClass("primary", "md", "mt-2")}>
        Ir al inicio del panel
      </Link>
    </div>
  );
}
