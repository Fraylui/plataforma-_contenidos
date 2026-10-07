"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Key } from "@phosphor-icons/react";
import { FormError } from "@/components/admin/ui";
import { Button, Card, Field, TextInput } from "@/components/ui";
import { changePasswordAction } from "@/app/admin/(protected)/cuenta/actions";

const MIN_LENGTH = 12; // = PasswordPolicy.MIN_LENGTH en el backend, que valida de verdad

const schema = z
  .object({
    current: z.string().min(1, "Escribe tu contraseña actual."),
    next: z.string().min(MIN_LENGTH, `Usa al menos ${MIN_LENGTH} caracteres.`),
    confirm: z.string(),
  })
  .refine((values) => values.next !== values.current, { path: ["next"], message: "Usa una contraseña distinta de la actual." })
  .refine((values) => values.next === values.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden." });

type Values = z.infer<typeof schema>;

/**
 * Cambio de la contraseña propia (Mi cuenta). Con contraseña temporal es lo
 * único que se puede hacer en el panel hasta completarlo. Piloto de
 * zod + react-hook-form: errores en cada campo y foco en el primero.
 */
export function ChangePasswordForm({ temporary }: { temporary: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { current: "", next: "", confirm: "" } });

  async function submit(values: Values) {
    const result = await changePasswordAction(values.current, values.next);
    if (!result.ok) return setError("root", { message: result.error });
    toast.success("Contraseña cambiada");
    reset();
    router.refresh();
  }

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Key className="size-5" weight="fill" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold tracking-tight text-foreground">Cambiar contraseña</h2>
        </div>
        {temporary && (
          <p className="rounded-control bg-accent-soft px-3 py-2 text-sm text-foreground">
            Entraste con una contraseña temporal. Elige una propia para empezar a usar el panel.
          </p>
        )}
        <Field label="Contraseña actual" name="current" error={errors.current?.message}>
          <TextInput id="current-password" type="password" autoComplete="current-password" {...register("current")} />
        </Field>
        <Field label="Contraseña nueva" name="next" hint={`Mínimo ${MIN_LENGTH} caracteres, distinta de la actual.`} error={errors.next?.message}>
          <TextInput id="new-password" type="password" autoComplete="new-password" {...register("next")} />
        </Field>
        <Field label="Repite la contraseña nueva" name="confirm" error={errors.confirm?.message}>
          <TextInput id="confirm-password" type="password" autoComplete="new-password" {...register("confirm")} />
        </Field>
        {errors.root?.message && <FormError message={errors.root.message} />}
        <Button type="submit" size="lg" loading={isSubmitting}>
          Cambiar contraseña
        </Button>
      </form>
    </Card>
  );
}
