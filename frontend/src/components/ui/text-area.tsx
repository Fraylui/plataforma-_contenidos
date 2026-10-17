"use client";

import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { fieldClass, markFieldControl } from "./field-styles";

type TextAreaProps = ComponentProps<"textarea"> & { invalid?: boolean };

/** Área de texto; con `maxLength` muestra un contador "n/máx" que parte del valor inicial. */
export const TextArea = markFieldControl(function TextArea({ invalid, className, onChange, ...rest }: TextAreaProps) {
  const [uncontrolledLength, setUncontrolledLength] = useState(String(rest.defaultValue ?? "").length);
  const length = rest.value != null ? String(rest.value).length : uncontrolledLength;

  const textarea = (
    <textarea
      {...rest}
      onChange={(event) => {
        setUncontrolledLength(event.target.value.length);
        onChange?.(event);
      }}
      aria-invalid={invalid || rest["aria-invalid"] || undefined}
      className={cn(fieldClass, "h-auto min-h-24 resize-y py-2.5 leading-relaxed", className)}
    />
  );
  if (rest.maxLength == null) return textarea;
  const nearLimit = length >= rest.maxLength * 0.9;
  return (
    <div>
      {textarea}
      <p className={cn("mt-1 text-right text-xs tabular-nums", nearLimit ? "font-medium text-warning" : "text-muted")}>
        {length}/{rest.maxLength}
      </p>
    </div>
  );
});
