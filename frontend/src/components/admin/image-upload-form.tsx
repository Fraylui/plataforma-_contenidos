"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadImageAction } from "@/app/admin/(protected)/imagenes/actions";
import { FormError } from "@/components/admin/ui";
import { Button, Field, TextInput } from "@/components/ui";

export function ImageUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (!(formData.get("file") instanceof File) || (formData.get("file") as File).size === 0) {
      setError("Selecciona un archivo.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await uploadImageAction(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-card border-2 border-dashed border-field-border bg-surface p-5">
      <label className="text-sm font-medium text-foreground">
        Archivo
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          className="mt-1 block text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-accent"
        />
      </label>
      <Field label="Texto alternativo (opcional)" name="altText" className="w-56">
        <TextInput type="text" />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Subiendo…" : "Subir imagen"}
      </Button>
      {error && <FormError message={error} className="w-full" />}
    </form>
  );
}
