"use client";

import type { AccessLevel, Module, ModulePermissions } from "@/lib/api/admin-types";
import { ACCESS_MODULES, CONTENT_MODULES, MODULE_LABELS } from "@/lib/admin/worker-templates";
import { SegmentedControl } from "@/components/ui/segmented-control";

type Choice = { value: AccessLevel | null; label: string };

// Tener un módulo de contenido es publicar en él (sin paso de aprobación).
const CONTENT_CHOICES: Choice[] = [
  { value: null, label: "No" },
  { value: "PUBLISH", label: "Publica" },
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
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[15px] font-semibold text-foreground">{MODULE_LABELS[module]}</span>
      <SegmentedControl label={MODULE_LABELS[module]} options={choices} value={value ?? null} onChange={onPick} />
    </div>
  );
}

/**
 * Matriz de permisos del trabajador (spec 2a §6): una fila por módulo con
 * control segmentado — contenido «No / Publica», el resto «No / Sí».
 * Sin desplegables.
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
