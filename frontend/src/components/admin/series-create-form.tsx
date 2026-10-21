"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { YoutubeLogo } from "@phosphor-icons/react";
import type { Category } from "@/lib/api/types";
import { createSeriesAction } from "@/app/admin/(protected)/series/actions";
import { FormError } from "@/components/admin/ui";
import { Button, Card, Field, Select, TextArea, TextInput } from "@/components/ui";

/**
 * Crear una serie = pegar el link de una lista de reproducción de YouTube.
 * Título y descripción son opcionales: si se dejan vacíos, se usa el nombre
 * de la lista. Al guardar se traen sus episodios en el acto.
 */
export function SeriesCreateForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await createSeriesAction({
      playlistUrl: playlistUrl.trim(),
      categoryId,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
    });
    if (!result.ok) {
      setPending(false);
      setError(result.error);
      return;
    }
    router.push(`/admin/series/${result.data.id}`);
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Link de la lista de reproducción de YouTube"
          name="playlistUrl"
          hint="En YouTube abre la lista y copia el link (contiene «list=»). Los videos nuevos de esa lista llegarán solos al sitio."
        >
          <TextInput
            type="url"
            required
            value={playlistUrl}
            onChange={(e) => setPlaylistUrl(e.target.value)}
            placeholder="https://www.youtube.com/playlist?list=…"
            leading={<YoutubeLogo aria-hidden="true" />}
          />
        </Field>
        <Field label="Tema" name="categoryId">
          <Select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="" disabled>
              Elige un tema
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Título (opcional)" name="title" hint="Si lo dejas vacío, se usa el nombre de la lista en YouTube.">
          <TextInput value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Descripción (opcional)" name="description">
          <TextArea value={description} maxLength={2000} rows={3} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        {error && <FormError message={error} />}
        <Button type="submit" size="lg" loading={pending} disabled={!playlistUrl.trim() || !categoryId}>
          {pending ? "Conectando con YouTube…" : "Crear serie"}
        </Button>
      </form>
    </Card>
  );
}
