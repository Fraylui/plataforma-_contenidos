"use client";

import { useState, type ComponentProps } from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { fieldClass, markFieldControl } from "./field-styles";

type DateKind = "datetime-local" | "date";

// La lectura repite la hora tal como se escribió en el campo (hora de pared):
// se formatea en UTC a propósito para que ninguna zona la corra.
const READING_DATE_TIME = new Intl.DateTimeFormat("es-PE", {
  timeZone: "UTC",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const READING_DATE = new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });

/** Lectura absoluta del valor de un input de fecha ("vie 12 dic, 7:00 p. m."), o null si está vacío o no es válido. */
export function formatDateTimeReading(value: string, type: DateKind): string | null {
  if (!value) return null;
  const wallClock = new Date(type === "date" ? `${value}T00:00:00Z` : `${value}:00Z`);
  if (Number.isNaN(wallClock.getTime())) return null;
  return (type === "date" ? READING_DATE : READING_DATE_TIME).format(wallClock);
}

type DateTimeInputProps = Omit<ComponentProps<"input">, "type"> & { type?: DateKind; invalid?: boolean };

/** Fecha (y hora) con el selector nativo y, debajo, cómo se leerá en el sitio. */
export const DateTimeInput = markFieldControl(function DateTimeInput({ type = "datetime-local", invalid, className, onChange, ...rest }: DateTimeInputProps) {
  const [uncontrolled, setUncontrolled] = useState(String(rest.defaultValue ?? ""));
  const value = rest.value != null ? String(rest.value) : uncontrolled;
  const reading = formatDateTimeReading(value, type);
  return (
    <div className={className}>
      <input
        {...rest}
        type={type}
        onChange={(event) => {
          setUncontrolled(event.target.value);
          onChange?.(event);
        }}
        aria-invalid={invalid || rest["aria-invalid"] || undefined}
        className={cn(fieldClass, "tabular-nums")}
      />
      {reading && (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <CalendarBlank aria-hidden="true" className="size-3.5" />
          {reading}
        </p>
      )}
    </div>
  );
});
