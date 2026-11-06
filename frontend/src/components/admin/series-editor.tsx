"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowClockwise, ArrowSquareOut, Archive, ArrowCounterClockwise, NotePencil, Plus, WarningCircle, YoutubeLogo } from "@phosphor-icons/react";
import type { AdminImage, AdminSeries } from "@/lib/api/admin-types";
import type { Category, Episode, PageResponse } from "@/lib/api/types";
import type { PublicationPermissions } from "@/lib/admin/publication";
import { formatPublishedDate } from "@/lib/content-labels";
import {
  addEpisodeAction,
  setEpisodeArchivedAction,
  syncSeriesAction,
  updateEpisodeAction,
  updateSeriesAction,
} from "@/app/admin/(protected)/series/actions";
import { PublishPanel } from "@/components/admin/publish-panel";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { SeriesCoverPicker } from "@/components/admin/series-cover-picker";
import { Dialog, DialogContent, DialogDescription, DialogTitle, FormError } from "@/components/admin/ui";
import { Badge, Button, Card, Field, Select, TextArea, TextInput } from "@/components/ui";

interface SeriesEditorProps {
  series: AdminSeries;
  episodes: PageResponse<Episode>;
  categories: Category[];
  allImages: AdminImage[];
  permissions: PublicationPermissions;
}

/**
 * Una serie en el panel: sus datos, el panel Publicar, la conexión con
 * YouTube (sincronizar ahora, último error) y sus episodios con notas
 * propias. Los videos los sirve YouTube; aquí solo se ordenan.
 */
export function SeriesEditor({ series, episodes, categories, allImages, permissions }: SeriesEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(series.title);
  const [description, setDescription] = useState(series.description ?? "");
  const [categoryId, setCategoryId] = useState(series.categoryId);
  const [coverImageId, setCoverImageId] = useState(series.coverImageId);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty =
    title !== series.title ||
    description !== (series.description ?? "") ||
    categoryId !== series.categoryId ||
    coverImageId !== series.coverImageId;

  async function save(): Promise<string | null> {
    if (!dirty) return series.id;
    setSaving(true);
    setError(null);
    const result = await updateSeriesAction(series.id, {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      coverImageId,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return null;
    }
    setSavedAt(new Date());
    router.refresh();
    return series.id;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <Card title="Datos de la serie">
          <Field label="Título" name="title">
            <TextInput value={title} maxLength={200} disabled={!permissions.canEdit} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Descripción" name="description">
            <TextArea value={description} maxLength={2000} rows={3} disabled={!permissions.canEdit} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Tema" name="categoryId">
            <Select value={categoryId} disabled={!permissions.canEdit} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
          <SeriesCoverPicker value={coverImageId} onChange={setCoverImageId} allImages={allImages} disabled={!permissions.canEdit} />
          {error && <FormError message={error} />}
        </Card>

        <EpisodesCard series={series} episodes={episodes} allImages={allImages} canEdit={permissions.canEdit} />
      </div>

      <aside className="space-y-6">
        <PublishPanel
          kind="series"
          item={{ id: series.id, status: series.status, scheduledAt: series.scheduledAt }}
          permissions={permissions}
          dirty={dirty}
          saving={saving}
          onSave={save}
          savedAt={savedAt}
        />
        <YouTubeCard series={series} />
      </aside>
    </div>
  );
}

function YouTubeCard({ series }: { series: AdminSeries }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

  async function sync() {
    setSyncing(true);
    const result = await syncSeriesAction(series.id);
    setSyncing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (result.data.lastSyncError) toast.error(result.data.lastSyncError);
    else toast.success(result.data.added === 0 ? "Todo al día: no hay videos nuevos." : `${result.data.added} episodios nuevos.`);
    router.refresh();
  }

  return (
    <Card title="YouTube">
      <a
        href={`https://www.youtube.com/playlist?list=${encodeURIComponent(series.youtubePlaylistId)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
      >
        <YoutubeLogo weight="fill" className="size-4" aria-hidden="true" />
        Ver la lista en YouTube
        <ArrowSquareOut className="size-3.5" aria-hidden="true" />
      </a>
      {series.lastSyncError ? (
        <p role="alert" className="flex gap-2 rounded-control bg-danger-soft px-3 py-2.5 text-sm text-foreground">
          <WarningCircle weight="fill" className="mt-0.5 size-4 shrink-0 text-danger-ink" aria-hidden="true" />
          <span>{series.lastSyncError} Se vuelve a intentar sola cada 30 minutos.</span>
        </p>
      ) : (
        <p className="text-sm text-muted">
          {series.lastSyncedAt
            ? `Revisada el ${formatPublishedDate(series.lastSyncedAt)}. Los videos nuevos de la lista llegan solos cada 30 minutos.`
            : "Los videos nuevos de la lista llegan solos cada 30 minutos."}
        </p>
      )}
      <Button variant="secondary" icon={<ArrowClockwise aria-hidden="true" />} loading={syncing} onClick={sync}>
        Sincronizar ahora
      </Button>
    </Card>
  );
}

function EpisodesCard({
  series,
  episodes,
  allImages,
  canEdit,
}: {
  series: AdminSeries;
  episodes: PageResponse<Episode>;
  allImages: AdminImage[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Episode | null>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    setAdding(true);
    const result = await addEpisodeAction(series.id, videoUrl.trim());
    setAdding(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setVideoUrl("");
    toast.success("Episodio agregado");
    router.refresh();
  }

  async function toggleArchived(episode: Episode) {
    const archive = episode.status === "PUBLISHED";
    const result = await setEpisodeArchivedAction(series.id, episode.id, archive);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(archive ? "Episodio oculto del sitio" : "Episodio visible otra vez");
    router.refresh();
  }

  return (
    <Card title={`Episodios (${episodes.totalElements})`}>
      {canEdit && (
        <form onSubmit={add} className="flex flex-col gap-2 sm:flex-row">
          <TextInput
            type="url"
            aria-label="Link de un video de YouTube"
            placeholder="Pega el link de un video para agregar un episodio anterior"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="secondary" icon={<Plus aria-hidden="true" />} loading={adding} disabled={!videoUrl.trim()}>
            Agregar
          </Button>
        </form>
      )}

      {episodes.items.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay episodios. Sube un video a la lista en YouTube o pega su link arriba.</p>
      ) : (
        <ul className="divide-y divide-border/60">
          {episodes.items.map((episode) => (
            <li key={episode.id} className="flex items-center gap-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura servida por YouTube (i.ytimg.com) */}
              <img
                src={`https://i.ytimg.com/vi/${episode.youtubeVideoId}/mqdefault.jpg`}
                alt=""
                loading="lazy"
                className="aspect-video w-28 shrink-0 rounded-lg bg-canvas-strong object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{episode.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                  {formatPublishedDate(episode.publishedAt)}
                  {episode.status === "ARCHIVED" && <Badge tone="neutral">Oculto</Badge>}
                  {!episode.notes && episode.status === "PUBLISHED" && <Badge tone="warning">Sin notas</Badge>}
                </p>
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="ghost" icon={<NotePencil aria-hidden="true" />} onClick={() => setEditing(episode)}>
                    Notas
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={episode.status === "PUBLISHED" ? <Archive aria-hidden="true" /> : <ArrowCounterClockwise aria-hidden="true" />}
                    onClick={() => toggleArchived(episode)}
                  >
                    {episode.status === "PUBLISHED" ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <EpisodeNotesDialog
          key={editing.id}
          seriesId={series.id}
          episode={editing}
          allImages={allImages}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

/** Notas propias del episodio: lo que hace única la página frente al video solo (lectores, Google y AdSense). */
function EpisodeNotesDialog({
  seriesId,
  episode,
  allImages,
  onClose,
}: {
  seriesId: string;
  episode: Episode;
  allImages: AdminImage[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(episode.title);
  const [notes, setNotes] = useState(episode.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const result = await updateEpisodeAction(seriesId, episode.id, { title: title.trim(), notes });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Episodio guardado");
    onClose();
    router.refresh();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>Notas del episodio</DialogTitle>
        <DialogDescription>
          Escribe con tus palabras de qué trata, datos curiosos o enlaces. Es lo que Google y AdSense valoran de la página.
        </DialogDescription>
        <div className="mt-4 space-y-4">
          <Field label="Título" name="episode-title">
            <TextInput value={title} maxLength={300} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <RichTextEditor value={notes} onChange={setNotes} allImages={allImages} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button loading={saving} disabled={!title.trim()} onClick={save}>
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
