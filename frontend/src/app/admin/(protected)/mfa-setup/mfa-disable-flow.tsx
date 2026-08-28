"use client";

import { useState } from "react";
import { disableMfaAction } from "./actions";

/** Exige el código TOTP actual — mismo criterio que MfaService.disable() en el backend, nunca solo el access token. */
export function MfaDisableFlow() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDisable() {
    setPending(true);
    setError(null);
    const result = await disableMfaAction(code);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setCode("");
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
      >
        Desactivar MFA
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-md border border-border bg-surface px-4 py-3">
      <label htmlFor="mfa-disable-code" className="block text-sm font-medium text-foreground">
        Escribe el código de 6 dígitos de tu app (o un código de respaldo) para confirmar
      </label>
      <input
        id="mfa-disable-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending || code.length === 0}
          onClick={handleDisable}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 dark:bg-red-500"
        >
          {pending ? "Desactivando…" : "Confirmar y desactivar"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
            setCode("");
          }}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent-soft"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
