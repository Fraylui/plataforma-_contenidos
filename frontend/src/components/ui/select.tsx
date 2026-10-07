import type { ComponentProps } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { fieldClass, markFieldControl } from "./field-styles";

/** `<select>` nativo con la apariencia del sistema (en celular abre el selector del teléfono). */
export const Select = markFieldControl(function Select({ className, invalid, ...rest }: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <div className={cn("relative w-full", className)}>
      <select {...rest} aria-invalid={invalid || rest["aria-invalid"] || undefined} className={cn(fieldClass, "cursor-pointer appearance-none pr-9")} />
      <CaretDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
});
