"use client";

import Link from "next/link";
import { useState } from "react";
import { confirmMfaEnrollmentAction, startMfaEnrollmentAction } from "./actions";

// El backend también devuelve provisioningUri (otpauth://...) pensado para
// un código QR, pero no lo renderizamos: generar el QR client-side
// requeriría una librería nueva solo para esto, y el ingreso manual de la
// clave ya es suficiente para cualquier app TOTP (justificación de
// dependencias — ver memoria "engineering-guardrails").
type Step =
  | { kind: "idle" }
  | { kind: "enrolling" }
  | { kind: "enrolled"; secretBase32: string }
  | { kind: "confirming"; secretBase32: string }
  | { kind: "done"; backupCodes: string[] };

export function MfaSetupFlow() {
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    setStep({ kind: "enrolling" });
    const result = await startMfaEnrollmentAction();
    if (!result.ok) {
      setError(result.error);
      setStep({ kind: "idle" });
      return;
    }
    setStep({ kind: "enrolled", secretBase32: result.secretBase32 });
  }

  async function handleConfirm(secretBase32: string) {
    setError(null);
    setStep({ kind: "confirming", secretBase32 });
    const result = await confirmMfaEnrollmentAction(code);
    if (!result.ok) {
      setError(result.error);
      setStep({ kind: "enrolled", secretBase32 });
      return;
    }
    setStep({ kind: "done", backupCodes: result.backupCodes });
  }

  if (step.kind === "done") {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent">
          MFA activado correctamente.
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Códigos de respaldo (guárdalos ahora, no se muestran de nuevo):</p>
          <ul className="mt-2 grid grid-cols-2 gap-2 font-mono text-sm">
            {step.backupCodes.map((backupCode) => (
              <li key={backupCode} className="rounded border border-border bg-surface px-2 py-1 text-foreground">
                {backupCode}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Cada código funciona una sola vez y sirve para entrar si pierdes acceso a tu app de autenticación.
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Ir al panel
        </Link>
      </div>
    );
  }

  if (step.kind === "enrolled" || step.kind === "confirming") {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-foreground">
            1. Agrega esta clave manualmente en tu app de autenticación (tipo: basado en tiempo / TOTP):
          </p>
          <code className="mt-2 block break-all rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-foreground">
            {step.secretBase32}
          </code>
        </div>
        <div>
          <label htmlFor="mfa-confirm-code" className="block text-sm font-medium text-foreground">
            2. Escribe el código de 6 dígitos que muestra la app
          </label>
          <input
            id="mfa-confirm-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={step.kind === "confirming" || code.length === 0}
          onClick={() => handleConfirm(step.secretBase32)}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
        >
          {step.kind === "confirming" ? "Verificando…" : "Confirmar y activar"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={step.kind === "enrolling"}
        onClick={handleStart}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {step.kind === "enrolling" ? "Generando…" : "Comenzar configuración"}
      </button>
    </div>
  );
}
