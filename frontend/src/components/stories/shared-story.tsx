"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActiveTopic } from "@/lib/api/types";
import type { HomeItem } from "@/lib/home-items";
import { StoryViewer, type CloseReason } from "./story-viewer";

/**
 * Una historia que llegó por enlace (/historias/{id}): se abre directo en el
 * visor; al cerrarlo se sigue en el Inicio. Con Atrás, el navegador ya vuelve
 * a donde estaba la persona (WhatsApp, otra página): no se empuja nada.
 */
export function SharedStory({ topic, imageSrc, recent }: { topic: ActiveTopic; imageSrc: Record<string, string>; recent: HomeItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <StoryViewer
      topics={[topic]}
      startTopicId={topic.category.id}
      recent={recent}
      imageSrc={imageSrc}
      onClose={(reason: CloseReason = "user") => {
        setOpen(false);
        if (reason === "user") router.push("/");
      }}
    />
  );
}
