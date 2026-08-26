"use client";

import { useState } from "react";
import type { GeographicUnit } from "@/lib/api/types";
import { renameGeographyAction } from "@/app/admin/(protected)/geografia/actions";

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
      <label className="block text-sm font-medium text-foreground">
        Nombre
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-accent">{notice}</p>}

      <button
        type="button"
        disabled={pending || !name.trim()}
        onClick={handleSubmit}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar nombre"}
      </button>
    </div>
  );
}
