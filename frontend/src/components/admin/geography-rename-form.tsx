"use client";

import { useState } from "react";
import type { GeographicUnit } from "@/lib/api/types";
import { renameGeographyAction } from "@/app/admin/(protected)/geografia/actions";
import { AdminButton, FormField, formInputClass } from "@/components/admin/ui";

export function GeographyRenameForm({ unit }: { unit: GeographicUnit }) {
  const [name, setName] = useState(unit.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setNotice(null);
    const result = await renameGeographyAction(unit.id, name);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice("Guardado.");
  }

  return (
    <div className="max-w-md space-y-4">
      <FormField label="Nombre">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={formInputClass} />
      </FormField>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-accent">{notice}</p>}

      <AdminButton disabled={pending || !name.trim()} onClick={handleSubmit}>
        {pending ? "Guardando…" : "Guardar nombre"}
      </AdminButton>
    </div>
  );
}
