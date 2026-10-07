"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowCounterClockwise, Prohibit, UserCheck } from "@phosphor-icons/react";
import type { ModulePermissions, Worker } from "@/lib/api/admin-types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger, FormError } from "@/components/admin/ui";
import {
  createWorkerAction,
  resetWorkerPasswordAction,
  setWorkerActiveAction,
  updateWorkerPermissionsAction,
} from "@/app/admin/(protected)/trabajadores/actions";
import { PermissionMatrix } from "./permission-matrix";
import { TemplateChips } from "./template-chips";
import { TemporaryPasswordDialog } from "./temporary-password-dialog";
import { Button, Field, TextInput } from "@/components/ui";

/**
 * Alta y ficha de un trabajador (spec 2a §6): datos, plantilla como punto
 * de partida, matriz de permisos y, en la ficha, restablecer contraseña y
 * desactivar/reactivar (con confirmación).
 */
export function WorkerForm({ worker }: { worker?: Worker }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState(worker?.email ?? "");
  const [firstName, setFirstName] = useState(worker?.firstName ?? "");
  const [lastName, setLastName] = useState(worker?.lastName ?? "");
  const [permissions, setPermissions] = useState<ModulePermissions>(worker?.permissions ?? {});
  const [password, setPassword] = useState<{ value: string; afterClose: () => void } | null>(null);
  const editing = Boolean(worker);
  const name = `${firstName} ${lastName}`.trim();

  function save() {
    setError(null);
    startTransition(async () => {
      if (worker) {
        const result = await updateWorkerPermissionsAction(worker.id, permissions);
        if (!result.ok) return setError(result.error);
        toast.success("Permisos guardados");
        router.refresh();
        return;
      }
      const result = await createWorkerAction({ email, firstName, lastName, permissions });
      if (!result.ok) return setError(result.error);
      setPassword({ value: result.data.temporaryPassword, afterClose: () => router.push(`/admin/trabajadores/${result.data.id}`) });
    });
  }

  function resetPassword() {
    if (!worker) return;
    startTransition(async () => {
      const result = await resetWorkerPasswordAction(worker.id);
      if (!result.ok) return void toast.error(result.error);
      setPassword({ value: result.data.temporaryPassword, afterClose: () => router.refresh() });
    });
  }

  function toggleActive() {
    if (!worker) return;
    startTransition(async () => {
      const result = await setWorkerActiveAction(worker.id, worker.status !== "ACTIVE");
      if (!result.ok) return void toast.error(result.error);
      toast.success(worker.status === "ACTIVE" ? "Trabajador desactivado" : "Trabajador reactivado");
      router.refresh();
    });
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <section className="rounded-2xl bg-surface p-5 sm:p-6">
        <h2 className="text-base font-bold text-foreground">Datos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" name="firstName">
            <TextInput id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={editing} required />
          </Field>
          <Field label="Apellido" name="lastName">
            <TextInput id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={editing} required />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Correo" name="email">
              <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={editing} required />
            </Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-surface p-5 sm:p-6">
        <h2 className="text-base font-bold text-foreground">Permisos</h2>
        <p className="mt-1 text-sm text-muted">Parte de una plantilla y ajusta lo que necesites. «Crear»: lo suyo, a revisión. «Publicar»: revisa y publica lo de todos.</p>
        <div className="mt-4">
          <TemplateChips onPick={setPermissions} />
        </div>
        <div className="mt-4">
          <PermissionMatrix value={permissions} onChange={setPermissions} />
        </div>
      </section>

      {error && <FormError message={error} />}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={save} disabled={pending || (!editing && (!email || !firstName || !lastName))}>
          {pending ? "Guardando…" : editing ? "Guardar permisos" : "Crear trabajador"}
        </Button>

        {worker && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="secondary" disabled={pending}>
                  <ArrowCounterClockwise className="h-4 w-4" aria-hidden="true" />
                  Restablecer contraseña
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>¿Restablecer la contraseña de {name}?</AlertDialogTitle>
                <AlertDialogDescription>Se crea una contraseña temporal nueva y se cierran sus sesiones abiertas.</AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={resetPassword}>Restablecer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant={worker.status === "ACTIVE" ? "danger" : "secondary"} disabled={pending}>
                  {worker.status === "ACTIVE" ? <Prohibit className="h-4 w-4" aria-hidden="true" /> : <UserCheck className="h-4 w-4" aria-hidden="true" />}
                  {worker.status === "ACTIVE" ? "Desactivar" : "Reactivar"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>{worker.status === "ACTIVE" ? `¿Desactivar a ${name}?` : `¿Reactivar a ${name}?`}</AlertDialogTitle>
                <AlertDialogDescription>
                  {worker.status === "ACTIVE"
                    ? "Pierde el acceso al panel al instante. Lo que publicó y su historial se conservan."
                    : "Vuelve a entrar con su contraseña y los permisos que tenía."}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={toggleActive}>{worker.status === "ACTIVE" ? "Desactivar" : "Reactivar"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      {password && (
        <TemporaryPasswordDialog
          name={name}
          password={password.value}
          onClose={() => {
            const next = password.afterClose;
            setPassword(null);
            next();
          }}
        />
      )}
    </div>
  );
}
