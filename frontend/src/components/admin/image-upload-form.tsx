"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadImageAction } from "@/app/admin/(protected)/medios/actions";

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
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-border p-4">
      <label className="text-sm font-medium text-foreground">
        Archivo
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          className="mt-1 block text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent"
        />
      </label>
      <label className="text-sm font-medium text-foreground">
        Texto alternativo (opcional)
        <input
          type="text"
          name="altText"
          className="mt-1 w-56 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Subiendo…" : "Subir imagen"}
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
