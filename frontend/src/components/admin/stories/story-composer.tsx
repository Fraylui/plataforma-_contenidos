"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { ImagesSquare, TextAa } from "@phosphor-icons/react";
import { toast } from "sonner";
import { uploadImageInlineAction } from "@/app/admin/(protected)/imagenes/actions";
import { createStoriesAction } from "@/app/admin/(protected)/historias/actions";
import { Button, Field, Select, buttonClass } from "@/components/ui";
import { PublishRulesCard } from "@/components/admin/guide/content-guide";
import { draftToItem, StoryDraftCard, type Draft } from "./story-draft-card";

const MAX_BATCH = 10;
const LAST_TOPIC_KEY = "historias-ultimo-tema";

function readLastTopic(): string {
  try {
    return localStorage.getItem(LAST_TOPIC_KEY) ?? "";
  } catch {
    return "";
  }
}

/** El último tema no cambia mientras se compone: no hay a qué suscribirse. */
function subscribeNothing() {
  return () => {};
}

function newDraft(patch: Partial<Draft>): Draft {
  return {
    key: crypto.randomUUID(), imageId: null, previewSrc: null, background: null, caption: "", captionPosition: "BOTTOM",
    link: null, youtubeUrl: "", highlighted: false, uploadState: "ready", ...patch,
  };
}

/**
 * Compositor de historias, pensado para el celular: elegir fotos (cada una es
 * una historia, en ese orden) o «Solo texto», el tema, y publicar el lote.
 * Las fotos se suben al elegirlas; una que falla bloquea publicar hasta
 * reintentarla o quitarla (nada se publica a medias).
 */
export function StoryComposer({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  // El último tema usado (en este navegador) viene elegido; lo que se elige a mano gana.
  const lastTopic = useSyncExternalStore(subscribeNothing, readLastTopic, () => "");
  const [chosenTopic, setCategoryId] = useState<string | null>(null);
  const categoryId = chosenTopic ?? (categories.some((c) => c.id === lastTopic) ? lastTopic : "");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [capped, setCapped] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const files = useRef(new Map<string, File>());

  function patch(key: string, change: Partial<Draft>) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...change } : draft)));
  }

  async function upload(key: string, file: File) {
    patch(key, { uploadState: "uploading", uploadError: undefined });
    const formData = new FormData();
    formData.set("file", file);
    formData.set("purpose", "STORY");
    const result = await uploadImageInlineAction(formData);
    if (result.ok) patch(key, { uploadState: "ready", imageId: result.data.id });
    else patch(key, { uploadState: "failed", uploadError: result.error });
  }

  function addPhotos(list: FileList | null) {
    const picked = Array.from(list ?? []);
    const room = MAX_BATCH - drafts.length;
    setCapped(picked.length > room);
    const added = picked.slice(0, Math.max(0, room)).map((file) => {
      const draft = newDraft({ previewSrc: URL.createObjectURL(file), uploadState: "uploading" });
      files.current.set(draft.key, file);
      return draft;
    });
    setDrafts((current) => [...current, ...added]);
    added.forEach((draft) => void upload(draft.key, files.current.get(draft.key)!));
  }

  function remove(key: string) {
    files.current.delete(key);
    setDrafts((current) => current.filter((draft) => draft.key !== key));
  }

  const topicName = categories.find((c) => c.id === categoryId)?.name ?? "";
  const blocked =
    drafts.length === 0 ||
    !categoryId ||
    drafts.some((d) => d.uploadState !== "ready" || (d.background !== null && d.caption.trim() === ""));
  const count = drafts.length;

  async function publish() {
    setPublishing(true);
    const result = await createStoriesAction(categoryId, drafts.map(draftToItem));
    setPublishing(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    try {
      localStorage.setItem(LAST_TOPIC_KEY, categoryId);
    } catch {
      // sin almacenamiento: la próxima vez se elige el tema de nuevo
    }
    toast.success(count === 1 ? "Historia publicada: se ve 24 h" : `${count} historias publicadas: se ven 24 h`, {
      action: { label: "Ver en el sitio", onClick: () => window.open("/", "_blank") },
    });
    router.push("/admin/historias");
  }

  return (
    <div className="space-y-4 pb-28">
      <div className="rounded-card bg-surface p-4 shadow-card">
        <Field label="Tema" name="story-topic" hint="Las historias aparecen en la burbuja de este tema, en el Inicio.">
          <Select id="story-topic" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">Elige un tema</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {drafts.map((draft, index) => (
        <StoryDraftCard
          key={draft.key}
          draft={draft}
          index={index}
          topicName={topicName}
          onChange={(change) => patch(draft.key, change)}
          onRemove={() => remove(draft.key)}
          onRetry={() => {
            const file = files.current.get(draft.key);
            if (file) void upload(draft.key, file);
          }}
        />
      ))}

      {capped && <p role="status" className="text-sm font-medium text-warning">Máximo 10 por vez: se agregaron las primeras.</p>}

      {drafts.length < MAX_BATCH && (
        <div className="grid grid-cols-2 gap-3">
          <label className={buttonClass("secondary", "lg", "cursor-pointer has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring")}>
            <ImagesSquare aria-hidden="true" />
            Elegir fotos
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(event) => {
              addPhotos(event.target.files);
              event.target.value = "";
            }} aria-label="Elegir fotos" />
          </label>
          <Button variant="secondary" size="lg" icon={<TextAa />} onClick={() => setDrafts((current) => [...current, newDraft({ background: "SUNSET" })])}>
            Solo texto
          </Button>
        </div>
      )}

      <PublishRulesCard />

      <div className="fixed inset-x-0 bottom-[calc(var(--bottom-bar-h,0px)+0.75rem)] z-40 flex justify-center px-4 lg:bottom-6">
        <div className="flex w-full max-w-xl items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-overlay">
          <p className="min-w-0 flex-1 text-sm text-muted">{count === 0 ? "Agrega fotos o un texto" : "Se ven 24 h en el Inicio"}</p>
          <Button onClick={() => void publish()} disabled={blocked} loading={publishing}>
            {count === 1 ? "Publicar 1 historia" : count === 0 ? "Publicar" : `Publicar ${count} historias`}
          </Button>
        </div>
      </div>
    </div>
  );
}
