"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { updateStoryAction } from "@/app/admin/(protected)/historias/actions";
import type { AdminStory } from "@/lib/api/admin-types";
import { imageUrl } from "@/lib/image-url";
import { Button } from "@/components/ui";
import { draftToItem, StoryDraftCard, type Draft } from "./story-draft-card";

function draftFrom(story: AdminStory): Draft {
  return {
    key: story.id,
    imageId: story.imageId,
    previewSrc: story.imageId ? imageUrl(`/api/v1/images/${story.imageId}/file`) : null,
    background: story.background,
    caption: story.caption ?? "",
    captionPosition: story.captionPosition,
    link: story.linkContentType && story.linkContentId
      ? { type: story.linkContentType, id: story.linkContentId, title: story.link?.title ?? "un contenido que ya no está publicado" }
      : null,
    youtubeUrl: story.youtubeVideoId ? `https://youtube.com/shorts/${story.youtubeVideoId}` : "",
    highlighted: story.highlighted,
    uploadState: "ready",
  };
}

/** Editar una historia publicada: texto, posición, enlace y Destacada (la foto o el fondo no cambian). */
export function StoryEditForm({ story }: { story: AdminStory }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => draftFrom(story));
  const [saving, setSaving] = useState(false);
  const missingText = draft.background !== null && draft.caption.trim() === "";

  async function save() {
    setSaving(true);
    const result = await updateStoryAction(story.id, draftToItem(draft));
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Historia actualizada");
    router.push("/admin/historias");
  }

  return (
    <div className="space-y-4">
      <StoryDraftCard draft={draft} index={0} topicName={story.categoryName} onChange={(change) => setDraft((d) => ({ ...d, ...change }))} />
      <div className="flex justify-end">
        <Button onClick={() => void save()} disabled={missingText} loading={saving}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
