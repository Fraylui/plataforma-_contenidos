import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/** Error general de un formulario (el de cada campo lo muestra `Field`). */
export function FormError({ message, className }: { message: string; className?: string }) {
  return (
    <p role="alert" className={cn("flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger-ink", className)}>
      <WarningCircle weight="fill" aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}
