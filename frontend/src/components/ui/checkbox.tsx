"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChoiceProps = Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode };

const BOX =
  "peer relative size-[18px] shrink-0 cursor-pointer appearance-none border-[1.5px] border-muted/60 bg-surface " +
  "outline-none transition-[background-color,border-color,box-shadow] duration-150 " +
  "hover:border-accent focus-visible:ring-[3px] focus-visible:ring-ring " +
  "checked:border-accent-fill checked:bg-accent-fill disabled:cursor-not-allowed disabled:opacity-50";

function Choice({ type, label, description, className, id, ...rest }: ChoiceProps & { type: "checkbox" | "radio" }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="relative mt-0.5 flex">
        <input
          {...rest}
          id={inputId}
          type={type}
          aria-describedby={descriptionId}
          className={cn(BOX, type === "checkbox" ? "rounded-[6px]" : "rounded-full")}
        />
        {type === "checkbox" ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute inset-0 m-auto size-3 scale-50 text-accent-foreground opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
          >
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-auto size-2 scale-0 rounded-full bg-accent-foreground transition-transform duration-150 peer-checked:scale-100"
          />
        )}
      </span>
      <span className="min-w-0">
        <label htmlFor={inputId} className="block cursor-pointer text-sm font-medium text-foreground">
          {label}
        </label>
        {description && (
          <span id={descriptionId} className="block text-xs text-muted">
            {description}
          </span>
        )}
      </span>
    </div>
  );
}

/** Casilla con la etiqueta incluida (clic en el texto la marca). */
export function Checkbox(props: ChoiceProps) {
  return <Choice {...props} type="checkbox" />;
}

export function Radio(props: ChoiceProps) {
  return <Choice {...props} type="radio" />;
}
