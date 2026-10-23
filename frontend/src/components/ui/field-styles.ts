/**
 * Apariencia común de los campos: fondo un tono bajo la tarjeta, borde
 * translúcido, anillo suave de marca al enfocar y rojo con aria-invalid.
 */
export const fieldClass =
  "block h-10 w-full rounded-control border border-field-border bg-field px-3 text-sm text-foreground " +
  "placeholder:text-muted/70 outline-none transition-[background-color,border-color,box-shadow] duration-150 " +
  "hover:bg-field-hover focus:border-accent focus:bg-surface focus:ring-[3px] focus:ring-ring " +
  "aria-[invalid=true]:border-danger-ink aria-[invalid=true]:focus:ring-danger/25 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

/** Marca un componente del sistema como control al que `Field` puede conectar etiqueta, ayuda y error. */
export function markFieldControl<T extends object>(component: T): T {
  return Object.assign(component, { fieldControl: true });
}
