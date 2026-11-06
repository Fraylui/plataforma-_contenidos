import type { ReactNode } from "react";

/**
 * Lista de registros del panel (temas, anunciantes, campañas, espacios) en
 * filas, no en tabla: en el celular una tabla obligaba a desplazarse de lado.
 * Título arriba con todo el ancho, datos debajo (se acomodan solos) y las
 * acciones a la derecha.
 */
export function AdminList({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="mt-6 divide-y divide-border overflow-hidden rounded-card bg-surface shadow-card">
      {children}
    </ul>
  );
}

export function AdminListRow({
  title,
  meta,
  actions,
  indent = 0,
}: {
  title: ReactNode;
  /** Datos pequeños bajo el título (estado, cifras, fechas). */
  meta?: ReactNode[];
  actions?: ReactNode;
  /** Nivel en un árbol (subtemas), hasta 4. */
  indent?: number;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-accent-soft/40">
      <div className="min-w-0 flex-1" style={indent ? { paddingLeft: `${Math.min(indent, 4) * 1.25}rem` } : undefined}>
        <div className="font-medium text-foreground">{title}</div>
        {meta && meta.length > 0 && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted">
            {meta.map((item, index) => (
              <span key={index}>{item}</span>
            ))}
          </div>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </li>
  );
}

/** Acción de texto de una fila (Activar/Desactivar), con área táctil de 44 px. */
export const ROW_ACTION_CLASS =
  "min-h-11 cursor-pointer px-1 text-xs font-medium text-muted underline underline-offset-2 hover:text-accent";
