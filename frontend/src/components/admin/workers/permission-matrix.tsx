"use client";

import { useId } from "react";
import type { AccessLevel, Module, ModulePermissions } from "@/lib/api/admin-types";
import { ACCESS_MODULES, CONTENT_MODULES, MODULE_LABELS } from "@/lib/admin/worker-templates";
import { cn } from "@/lib/utils";

type Choice = { value: AccessLevel | null; label: string };

const CONTENT_CHOICES: Choice[] = [
  { value: null, label: "No" },
  { value: "CREATE", label: "Crear" },
  { value: "PUBLISH", label: "Publicar" },
];
const ACCESS_CHOICES: Choice[] = [
  { value: null, label: "No" },
  { value: "ACCESS", label: "Sí" },
];

function Row({
  module,
  choices,
  value,
  onPick,
}: {
  module: Module;
  choices: Choice[];
  value: AccessLevel | undefined;
  onPick: (v: AccessLevel | null) => void;
}) {
  const name = useId();
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[15px] font-semibold text-foreground">{MODULE_LABELS[module]}</span>
      {/* Control segmentado con radios nativos: flechas del teclado y lector de pantalla sin código extra. */}
      <div role="radiogroup" aria-label={MODULE_LABELS[module]} className="inline-flex w-full rounded-full bg-canvas-strong p-1 sm:w-auto">
        {choices.map((choice) => {
          const checked = (value ?? null) === choice.value;
          return (
            <label
              key={choice.label}
              className={cn(
                "flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent sm:flex-none",
                checked ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name={name}
                aria-label={choice.label}
                checked={checked}
                onChange={() => onPick(choice.value)}
                className="sr-only"
              />
              <span aria-hidden="true">{choice.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Matriz de permisos del trabajador (spec 2a §6): una fila por módulo con
 * control segmentado — contenido «No / Crear / Publicar», el resto
 * «No / Sí». Sin desplegables.
 */
export function PermissionMatrix({ value, onChange }: { value: ModulePermissions; onChange: (next: ModulePermissions) => void }) {
  function pick(module: Module, level: AccessLevel | null) {
    const next = { ...value };
    if (level === null) delete next[module];
    else next[module] = level;
    onChange(next);
  }

  return (
    <div className="flex flex-col">
      <p className="text-xs font-semibold text-muted">Contenido</p>
      <div className="divide-y divide-border/50">
        {CONTENT_MODULES.map((module) => (
          <Row key={module} module={module} choices={CONTENT_CHOICES} value={value[module]} onPick={(v) => pick(module, v)} />
        ))}
      </div>
      <p className="mt-4 text-xs font-semibold text-muted">Otras secciones</p>
      <div className="divide-y divide-border/50">
        {ACCESS_MODULES.map((module) => (
          <Row key={module} module={module} choices={ACCESS_CHOICES} value={value[module]} onPick={(v) => pick(module, v)} />
        ))}
      </div>
    </div>
  );
}
