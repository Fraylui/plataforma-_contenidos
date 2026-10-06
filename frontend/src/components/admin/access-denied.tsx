import { LockSimple } from "@phosphor-icons/react/dist/ssr";

/** Sección del panel fuera de los permisos del trabajador (el servidor respondió 403). */
export function AccessDenied() {
  return (
    <div className="flex max-w-md items-start gap-3 rounded-2xl bg-surface p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas-strong text-muted">
        <LockSimple className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-[15px] font-semibold text-foreground">No tienes acceso a esta sección</p>
        <p className="mt-0.5 text-sm text-muted">Si la necesitas, pídele al dueño del panel que te la asigne.</p>
      </div>
    </div>
  );
}
