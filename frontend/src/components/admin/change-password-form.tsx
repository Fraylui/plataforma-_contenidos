"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Key } from "@phosphor-icons/react";
import { AdminButton, FormError, FormField, formInputClass } from "@/components/admin/ui";
import { changePasswordAction } from "@/app/admin/(protected)/cuenta/actions";

const MIN_LENGTH = 12; // = PasswordPolicy.MIN_LENGTH en el backend, que valida de verdad

/**
 * Cambio de la contraseña propia (Mi cuenta). Con contraseña temporal es lo
 * único que se puede hacer en el panel hasta completarlo.
 */
export function ChangePasswordForm({ temporary }: { temporary: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (next.length < MIN_LENGTH) return setError(`Usa al menos ${MIN_LENGTH} caracteres.`);
    if (next !== confirm) return setError("Las contraseñas no coinciden.");
    setError(null);
    startTransition(async () => {
      const result = await changePasswordAction(current, next);
      if (!result.ok) return setError(result.error);
      toast.success("Contraseña cambiada");
      setCurrent("");
      setNext("");
      setConfirm("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-4 rounded-2xl bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Key className="h-5 w-5" weight="fill" aria-hidden="true" />
        </span>
        <h2 className="text-base font-bold text-foreground">Cambiar contraseña</h2>
      </div>
      {temporary && (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-foreground">
          Entraste con una contraseña temporal. Elige una propia para empezar a usar el panel.
        </p>
      )}
      <FormField label="Contraseña actual" name="current-password">
        <input id="current-password" type="password" autoComplete="current-password" className={formInputClass} value={current} onChange={(e) => setCurrent(e.target.value)} required />
      </FormField>
      <FormField label="Contraseña nueva" name="new-password">
        <input id="new-password" type="password" autoComplete="new-password" className={formInputClass} value={next} onChange={(e) => setNext(e.target.value)} required />
      </FormField>
      <FormField label="Repite la contraseña nueva" name="confirm-password">
        <input id="confirm-password" type="password" autoComplete="new-password" className={formInputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </FormField>
      <p className="text-xs text-muted">Mínimo {MIN_LENGTH} caracteres, distinta de la actual.</p>
      {error && <FormError message={error} />}
      <AdminButton type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </AdminButton>
    </form>
  );
}
