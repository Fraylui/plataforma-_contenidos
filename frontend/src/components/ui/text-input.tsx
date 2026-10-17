import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fieldClass, markFieldControl } from "./field-styles";

type TextInputProps = ComponentProps<"input"> & {
  /** Contenido fijo al inicio (ícono, "S/"). */
  leading?: ReactNode;
  /** Contenido al final (unidad, o un botón como "mostrar contraseña": este lado sí recibe clics). */
  trailing?: ReactNode;
  invalid?: boolean;
};

const ADORNMENT = "absolute inset-y-0 flex items-center text-sm text-muted [&_svg]:size-4";

export const TextInput = markFieldControl(function TextInput({ leading, trailing, invalid, className, ...rest }: TextInputProps) {
  const adorned = leading != null || trailing != null;
  const input = (
    <input
      {...rest}
      aria-invalid={invalid || rest["aria-invalid"] || undefined}
      className={cn(fieldClass, leading != null && "pl-9", trailing != null && "pr-12", !adorned && className)}
    />
  );
  if (!adorned) return input;
  return (
    <div className={cn("relative w-full", className)}>
      {leading != null && <span className={cn(ADORNMENT, "pointer-events-none left-3")}>{leading}</span>}
      {input}
      {trailing != null && <span className={cn(ADORNMENT, "right-2")}>{trailing}</span>}
    </div>
  );
});
