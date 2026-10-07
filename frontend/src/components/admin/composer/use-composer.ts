"use client";

import { useEffect, useState } from "react";
import { useForm, type DefaultValues, type FieldValues, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import type { ActionResult, MutationResult } from "@/lib/admin/action-helpers";
import type { PublicationStatus } from "@/lib/api/types";
import { useAutosave } from "../use-autosave";

interface UseComposerOptions<V extends FieldValues, I> {
  schema: z.ZodType<V>;
  defaultValues: V;
  /** id de lo guardado; vacío si es nuevo. */
  initialId: string;
  status: PublicationStatus;
  readOnly: boolean;
  toInput: (values: V) => I;
  create: (input: I) => Promise<MutationResult<{ id: string }>>;
  update: (id: string, input: I) => Promise<ActionResult>;
  /** Ruta del panel del tipo ("/admin/lugares"): la URL pasa a la de edición al crear. */
  adminPath: string;
}

/**
 * Lo que comparten los compositores de los 5 tipos: formulario con zod,
 * guardar (crear la primera vez, editar después), guardado automático del
 * borrador cada 10 s, aviso al salir con cambios y hora del último guardado.
 */
export function useComposer<V extends FieldValues, I>({
  schema,
  defaultValues,
  initialId,
  status,
  readOnly,
  toInput,
  create,
  update,
  adminPath,
}: UseComposerOptions<V, I>) {
  const [id, setId] = useState(initialId);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<V>({
    resolver: zodResolver(schema as never) as unknown as Resolver<V>,
    defaultValues: defaultValues as DefaultValues<V>,
  });
  const { handleSubmit, reset, getValues, formState } = form;

  async function persist(values: V): Promise<string | null> {
    setSaving(true);
    setError(null);
    const input = toInput(values);
    let savedId = id;
    let failure: string | null = null;
    if (id) {
      const result = await update(id, input);
      if (!result.ok) failure = result.error;
    } else {
      const result = await create(input);
      if (result.ok) savedId = result.data.id;
      else failure = result.error;
    }
    setSaving(false);
    if (failure) {
      setError(failure);
      toast.error(failure);
      return null;
    }
    if (!id) {
      setId(savedId);
      // Cambia la URL a la de edición sin recargar: quien escribe no pierde el foco.
      window.history.replaceState(null, "", `${adminPath}/${savedId}`);
    }
    reset(values, { keepValues: true });
    setSavedAt(new Date());
    return savedId;
  }

  /** Guardar validando: errores en el campo y foco al primero. */
  function save(): Promise<string | null> {
    return new Promise((resolve) => {
      void handleSubmit(
        async (values) => resolve(await persist(values)),
        () => resolve(null),
      )();
    });
  }

  // Solo el borrador y solo si ya es válido (en silencio: sin mover el foco ni marcar errores).
  useAutosave({
    enabled: status === "DRAFT" && !readOnly,
    dirty: formState.isDirty,
    save: async () => {
      const parsed = schema.safeParse(getValues());
      if (parsed.success) await persist(parsed.data);
    },
  });

  useEffect(() => {
    if (!formState.isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [formState.isDirty]);

  return { form, id, save, saving, savedAt, error };
}
