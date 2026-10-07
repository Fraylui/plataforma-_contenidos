"use client";

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";

const NATIVE_CONTROLS = new Set(["input", "select", "textarea"]);

interface ControlProps {
  id?: string;
  name?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false";
}

function isConnectable(node: ReactNode): node is ReactElement<ControlProps> {
  if (!isValidElement(node)) return false;
  if (typeof node.type === "string") return NATIVE_CONTROLS.has(node.type);
  return Boolean((node.type as { fieldControl?: boolean }).fieldControl);
}

/**
 * Etiqueta + control + ayuda + error. A un control nativo o del sistema le
 * da `id` (si no trae uno propio), `name`, `required`, `aria-invalid` y
 * `aria-describedby` con la ayuda y el error. Cualquier otro hijo (un campo
 * compuesto) queda envuelto en la etiqueta, como antes.
 */
export function Field({
  label,
  name,
  hint,
  error,
  required = false,
  hideLabel = false,
  className,
  children,
}: {
  label: string;
  name: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  /** La etiqueta no se ve (p. ej. el título grande del compositor) pero sigue nombrando el control. */
  hideLabel?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const child = Children.only(children);
  const labelText = (
    <>
      {label}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-danger-ink">
          *
        </span>
      )}
    </>
  );

  if (!isConnectable(child)) {
    return (
      <div className={className}>
        <label className="block space-y-1.5 text-label font-medium text-foreground">
          <span className="block">{labelText}</span>
          {child}
        </label>
        <FieldMessages hint={hint} error={error} />
      </div>
    );
  }

  const controlId = child.props.id ?? name;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [child.props["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={controlId} className={hideLabel ? "sr-only" : "mb-1.5 block text-label font-medium text-foreground"}>
        {labelText}
      </label>
      {cloneElement(child, {
        id: controlId,
        name: child.props.name ?? name,
        required: child.props.required ?? (required || undefined),
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : child.props["aria-invalid"],
      })}
      <FieldMessages hint={hint} hintId={hintId} error={error} errorId={errorId} />
    </div>
  );
}

function FieldMessages({ hint, hintId, error, errorId }: { hint?: ReactNode; hintId?: string; error?: string | null; errorId?: string }) {
  return (
    <>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger-ink">
          <WarningCircle weight="fill" aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </>
  );
}
