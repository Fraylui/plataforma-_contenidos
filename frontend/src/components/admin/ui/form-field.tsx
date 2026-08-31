import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

export const formInputClass =
  "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent disabled:opacity-60";

const FORM_CONTROL_TAGS = new Set(["input", "select", "textarea"]);

/**
 * `name` identifica el campo (id/name del <input>/<select>/<textarea> real,
 * y ancla el <label> vía htmlFor) — antes cada input se escribía sin id/name
 * en 6 formularios casi idénticos, lo que Chrome marca como problema de
 * autocompletado ("A form field element should have an id or name
 * attribute"). Solo se clona si el hijo es EXACTAMENTE un input/select/
 * textarea nativo — no cualquier elemento del DOM. Un <div> envolviendo el
 * campo real (ImageUrlField: input + preview + botón de subida) también es
 * "string" como tipo de React, y clonarle id/name ahí ponía el label a
 * apuntar a un <div>, no un control de formulario real ("Incorrect use of
 * <label for>", encontrado en la consola real del sitio). Un componente
 * propio (GeographyPicker, TagInput, etc.) tampoco entra acá, por la misma
 * razón de siempre: no declara esas props.
 */
export function FormField({ label, name, children }: { label: string; name: string; children: ReactNode }) {
  const child = Children.only(children);
  const isNativeFormElement =
    isValidElement(child) && typeof (child as ReactElement).type === "string" && FORM_CONTROL_TAGS.has((child as ReactElement).type as string);
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
