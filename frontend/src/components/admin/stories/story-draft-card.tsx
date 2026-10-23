"use client";

import { ArrowClockwise, Trash } from "@phosphor-icons/react";
import type { StoryItemInput } from "@/lib/api/admin-types";
import type { CaptionPosition, StoryBackground } from "@/lib/api/types";
import { STORY_BACKGROUND_OPTIONS } from "@/lib/stories/backgrounds";
import { StoryFrame } from "@/components/stories/story-frame";
import { Button, Checkbox, Field, TextArea, TextInput } from "@/components/ui";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StoryLinkPicker, type StoryLinkValue } from "./story-link-picker";

export interface Draft {
  key: string;
  imageId: string | null;
  /** Vista previa local de la foto (URL.createObjectURL) mientras se sube y después. */
  previewSrc: string | null;
  background: StoryBackground | null;
  caption: string;
  captionPosition: CaptionPosition;
  link: StoryLinkValue | null;
  youtubeUrl: string;
  highlighted: boolean;
  uploadState: "uploading" | "ready" | "failed";
  uploadError?: string;
}

/** Lo que se manda al backend (StoryDtos.StoryItemRequest). */
export function draftToItem(draft: Draft): StoryItemInput {
  return {
    imageId: draft.imageId,
    background: draft.background,
    caption: draft.caption.trim() || null,
    captionPosition: draft.captionPosition,
    linkType: draft.link?.type ?? null,
    linkId: draft.link?.id ?? null,
    youtubeUrl: draft.youtubeUrl.trim() || null,
    highlighted: draft.highlighted,
  };
}

const POSITIONS: { value: CaptionPosition; label: string }[] = [
  { value: "TOP", label: "Arriba" },
  { value: "CENTER", label: "Centro" },
  { value: "BOTTOM", label: "Abajo" },
];

/** Una historia del lote: vista previa 9:16 en vivo y sus opciones. */
export function StoryDraftCard({ draft, index, topicName, onChange, onRemove, onRetry }: {
  draft: Draft;
  index: number;
  topicName: string;
  onChange: (patch: Partial<Draft>) => void;
  /** Sin él (editar una ya publicada), no hay botón Quitar: se elimina desde la lista. */
  onRemove?: () => void;
  onRetry?: () => void;
}) {
  const label = `Historia ${index + 1}`;
  return (
    <section role="group" aria-label={label} className="grid gap-4 rounded-card bg-surface p-4 shadow-card sm:grid-cols-[180px_1fr]">
      <div className="relative mx-auto aspect-[9/16] w-[180px] overflow-hidden rounded-card bg-black">
        <StoryFrame
          interactive={false}
          story={{
            id: draft.key,
            imageId: draft.imageId ?? (draft.previewSrc ? draft.key : null),
            background: draft.background,
            caption: draft.caption.trim() || null,
            captionPosition: draft.captionPosition,
            link: draft.link ? { type: draft.link.type, slug: "", title: draft.link.title, label: "Ver más" } : null,
            youtubeVideoId: null,
          }}
          src={draft.previewSrc}
        />
        {draft.uploadState === "uploading" && (
          <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-medium text-white">Subiendo…</span>
        )}
      </div>

      <div className="min-w-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          {onRemove && (
            <Button variant="ghost" size="sm" icon={<Trash />} onClick={onRemove}>
              Quitar
            </Button>
          )}
        </div>

        {draft.uploadState === "failed" && onRetry && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger-ink">
            <span>{`No se pudo subir: ${draft.uploadError ?? "inténtalo otra vez"}`}</span>
            <Button variant="secondary" size="sm" icon={<ArrowClockwise />} onClick={onRetry}>
              Reintentar
            </Button>
          </div>
        )}

        {draft.background && (
          <SegmentedControl
            label="Fondo"
            options={STORY_BACKGROUND_OPTIONS}
            value={draft.background}
            onChange={(background) => onChange({ background })}
          />
        )}

        <Field label="Texto" name={`caption-${draft.key}`} hint={draft.background ? "Obligatorio en una historia de solo color." : "Opcional, va sobre la foto."}>
          <TextArea
            id={`caption-${draft.key}`}
            value={draft.caption}
            maxLength={140}
            rows={2}
            onChange={(event) => onChange({ caption: event.target.value })}
          />
        </Field>

        <SegmentedControl label="Posición del texto" options={POSITIONS} value={draft.captionPosition} onChange={(captionPosition) => onChange({ captionPosition })} />

        <StoryLinkPicker value={draft.link} onChange={(link) => onChange({ link })} disabled={draft.youtubeUrl.trim() !== ""} />

        <Field label="Video de YouTube (opcional)" name={`short-${draft.key}`} hint="Un Short: se reproduce al tocarlo.">
          <TextInput
            id={`short-${draft.key}`}
            type="url"
            value={draft.youtubeUrl}
            disabled={draft.link !== null}
            placeholder="https://youtube.com/shorts/…"
            onChange={(event) => onChange({ youtubeUrl: event.target.value })}
            autoComplete="off"
            spellCheck={false}
          />
        </Field>

        <Checkbox
          label={`Guardar en Destacadas de ${topicName || "su tema"}`}
          description="No caduca: queda en la página del tema."
          checked={draft.highlighted}
          onChange={(event) => onChange({ highlighted: event.target.checked })}
        />
      </div>
    </section>
  );
}
