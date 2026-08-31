import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export const formInputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent disabled:opacity-60";

/**
 * `name` identifica el campo (id/name del <input>/<select>/<textarea> real,
 * y ancla el <label> vía htmlFor) — antes cada input se escribía sin id/name
 * en 6 formularios casi idénticos, lo que Chrome marca como problema de
 * autocompletado ("A form field element should have an id or name
 * attribute"). Solo se clona si el hijo es un elemento nativo del DOM
 * (input/select/textarea) — un componente propio (GeographyPicker,
 * TagInput, etc.) no declara esas props y no debe recibirlas.
 */
export function FormField({ label, name, children }: { label: string; name: string; children: ReactNode }) {
  const child = Children.only(children);
  const isNativeFormElement = isValidElement(child) && typeof (child as ReactElement).type === "string";
  const content = isNativeFormElement
    ? cloneElement(child as ReactElement<{ id?: string; name?: string }>, { id: name, name })
    : children;

  return (
    <label htmlFor={isNativeFormElement ? name : undefined} className="block text-sm font-medium text-foreground">
      {label}
      {content}
    </label>
  );
}
