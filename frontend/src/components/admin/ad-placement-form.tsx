"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AdPlacement } from "@/lib/api/types";
import {
  createAdPlacementAction,
  updateAdPlacementAction,
  type ActionResult,
} from "@/app/admin/(protected)/publicidad/actions";
import { AdminButton, FormError, FormField, formInputClass } from "@/components/admin/ui";

interface AdPlacementFormProps {
  mode: "create" | "edit";
  placement?: AdPlacement;
}

export function AdPlacementForm({ mode, placement }: AdPlacementFormProps) {
  const [key, setKey] = useState(placement?.key ?? "");
  const [label, setLabel] = useState(placement?.label ?? "");
  const [adsenseSlotId, setAdsenseSlotId] = useState(placement?.adsenseSlotId ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    const slot = adsenseSlotId.trim() || null;
    const result: ActionResult =
      mode === "create"
        ? await createAdPlacementAction({ key, label, adsenseSlotId: slot })
        : await updateAdPlacementAction(placement!.id, { label, adsenseSlotId: slot });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      toast.error(result.error);
      return;
    }
    toast.success("Guardado.");
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-border/60 bg-surface p-5">
      {mode === "create" && (
        <FormField
          label="Clave (se usa en el código: <AdBlock position=&quot;...&quot; />)"
          name="key"
        >
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ej. sidebar-top"
            className={formInputClass}
          />
        </FormField>
      )}

      <FormField label="Nombre (solo para identificarla en el panel)" name="label">
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={formInputClass} />
      </FormField>

      <FormField label="Slot de AdSense (opcional hasta que Google lo asigne)" name="adsenseSlotId">
        <input
          type="text"
          value={adsenseSlotId}
          onChange={(e) => setAdsenseSlotId(e.target.value)}
          className={formInputClass}
        />
      </FormField>

      {error && <FormError message={error} />}
      <AdminButton
        disabled={pending || !label.trim() || (mode === "create" && !key.trim())}
        onClick={handleSubmit}
      >
        {pending ? "Guardando…" : mode === "create" ? "Crear posición" : "Guardar cambios"}
      </AdminButton>
    </div>
  );
}
