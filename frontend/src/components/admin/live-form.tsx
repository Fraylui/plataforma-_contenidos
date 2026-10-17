"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { YoutubeLogo } from "@phosphor-icons/react";
import type { AdminSeries } from "@/lib/api/admin-types";
import type { Category, LiveStream } from "@/lib/api/types";
import { createLiveAction, updateLiveAction } from "@/app/admin/(protected)/en-vivo/actions";
import { FormError } from "@/components/admin/ui";
import { Button, Card, DateTimeInput, Field, Select, TextArea, TextInput } from "@/components/ui";

/** ISO → valor de <input type="datetime-local"> en la hora local de quien edita. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Programar (o editar) una transmisión: el link de YouTube, título, tema,
 * serie opcional y cuándo empieza. Con la hora, el sitio la anuncia en
 * "Próximas transmisiones"; al empezar, se marca "Estamos en vivo".
 */
export function LiveForm({ categories, series, stream }: { categories: Category[]; series: AdminSeries[]; stream?: LiveStream }) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState(stream ? `https://www.youtube.com/live/${stream.youtubeVideoId}` : "");
  const [title, setTitle] = useState(stream?.title ?? "");
  const [description, setDescription] = useState(stream?.description ?? "");
  const [categoryId, setCategoryId] = useState(stream?.categoryId ?? categories[0]?.id ?? "");
  const [seriesId, setSeriesId] = useState(stream?.seriesId ?? "");
  const [scheduledStart, setScheduledStart] = useState(toLocalInput(stream?.scheduledStart ?? null));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const input = {
      videoUrl: videoUrl.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      categoryId,
      seriesId: seriesId || null,
      scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
    };
    if (stream) {
      const result = await updateLiveAction(stream.id, input);
      setPending(false);
      if (!result.ok) setError(result.error);
      else router.push("/admin/en-vivo");
      return;
    }
    const result = await createLiveAction(input);
    if (!result.ok) {
      setPending(false);
      setError(result.error);
      return;
    }
    router.push("/admin/en-vivo");
  }

  return (
    <Card className="max-w-2xl">
      <form onSubmit={submit} className="space-y-5">
        <Field
          label="Link de la transmisión en YouTube"
          name="videoUrl"
          hint="Créala en YouTube (Transmitir en vivo) y copia su link. Se verá dentro de tu sitio."
        >
          <TextInput
            type="url"
            required
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/live/…"
            leading={<YoutubeLogo aria-hidden="true" />}
          />
        </Field>
        <Field label="Título" name="title">
          <TextInput required value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Descripción (opcional)" name="description">
          <TextArea value={description} maxLength={2000} rows={3} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Tema" name="categoryId">
            <Select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Serie (opcional)" name="seriesId">
            <Select value={seriesId} onChange={(e) => setSeriesId(e.target.value)}>
              <option value="">Ninguna</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Empieza (opcional)" name="scheduledStart" hint="Con fecha y hora se anuncia en «Próximas transmisiones».">
          <DateTimeInput value={scheduledStart} onChange={(e) => setScheduledStart(e.target.value)} />
        </Field>
        {error && <FormError message={error} />}
        <Button type="submit" size="lg" loading={pending} disabled={!videoUrl.trim() || !title.trim() || !categoryId}>
          {stream ? "Guardar cambios" : "Programar transmisión"}
        </Button>
      </form>
    </Card>
  );
}
