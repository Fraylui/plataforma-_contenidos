"use client";

import { useState } from "react";
import { disableMfaAction } from "./actions";
import { AdminButton, formInputClass } from "@/components/admin/ui";

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
        className={formInputClass}
      />
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <AdminButton variant="danger" disabled={pending || code.length === 0} onClick={handleDisable}>
          {pending ? "Desactivando…" : "Confirmar y desactivar"}
        </AdminButton>
        <AdminButton
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(null);
            setCode("");
          }}
        >
          Cancelar
        </AdminButton>
      </div>
    </div>
  );
}
