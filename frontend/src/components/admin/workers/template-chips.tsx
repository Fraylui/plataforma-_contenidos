"use client";

import type { ModulePermissions } from "@/lib/api/admin-types";
import { WORKER_TEMPLATES } from "@/lib/admin/worker-templates";

/** Plantillas como chips: precargan la matriz (después se ajusta módulo por módulo). */
export function TemplateChips({ onPick }: { onPick: (permissions: ModulePermissions) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {WORKER_TEMPLATES.map((template) => (
        <button
          key={template.id}
          type="button"
          title={template.description}
          onClick={() => onPick({ ...template.permissions })}
          className="inline-flex min-h-9 cursor-pointer items-center rounded-full bg-canvas-strong px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent-soft hover:text-accent"
        >
          {template.label}
        </button>
      ))}
    </div>
  );
}
