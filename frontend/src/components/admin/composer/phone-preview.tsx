"use client";

import { useState } from "react";
import { useWatch } from "react-hook-form";
import { DeviceMobile, HandsClapping, Heart, Lightning, Play, Smiley } from "@phosphor-icons/react";
import type { AdminImage, ContentVideoInput } from "@/lib/api/admin-types";
import type { Category, ContentImage } from "@/lib/api/types";
import { youtubeVideoId } from "@/lib/ads/native-media";
import { imageUrl } from "@/lib/image-url";
import { PROSE } from "@/lib/prose";
import { Button } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/admin/ui";
import type { BaseComposerValues } from "./schema";

/** URL de cada foto elegida, en orden (subidas o enlaces que ya estaban). */
export function previewImageUrls(images: ContentImage[] | undefined, allImages: AdminImage[]): string[] {
  return (images ?? []).flatMap((image) => {
    const uploaded = image.imageId ? allImages.find((a) => a.id === image.imageId) : undefined;
    const url = uploaded ? imageUrl(uploaded.url) : image.externalUrl;
    return url ? [url] : [];
  });
}

/** El texto con el tamaño de un celular aunque el panel se vea en computadora (sin el sm:prose-lg). */
const PHONE_PROSE = PROSE.replace(/\bsm:prose-lg\b/, "");

const REACTION_PREVIEW = [
  { icon: Heart, label: "Encanta", color: "from-rose-400 to-pink-600" },
  { icon: Smiley, label: "Divierte", color: "from-amber-300 to-orange-500" },
  { icon: Lightning, label: "Sorprende", color: "from-violet-400 to-indigo-600" },
  { icon: HandsClapping, label: "Inspira", color: "from-sky-400 to-cyan-600" },
];

/**
 * «Ver como en el celular»: el post completo, tal como lo verá la gente en
 * un teléfono, con lo que hay escrito ahora (aunque sea borrador y todavía no
 * exista en el sitio). Fotos, título, descripción, videos, texto y cómo
 * termina (las reacciones). Solo para mirar: nada se puede tocar adentro.
 */
export function PhonePreview({
  siteName,
  categories,
  allImages,
}: {
  siteName: string;
  categories: Category[];
  allImages: AdminImage[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" icon={<DeviceMobile aria-hidden="true" />} onClick={() => setOpen(true)} className="w-full">
        Ver como en el celular
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[95dvh] w-auto max-w-[min(420px,calc(100%-1rem))] flex-col items-center p-4 sm:p-6">
          <DialogTitle>Así se verá en el celular</DialogTitle>
          <DialogDescription>Con lo que escribiste hasta ahora. Cierra para seguir editando.</DialogDescription>
          {open && <PhoneScreen siteName={siteName} categories={categories} allImages={allImages} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PhoneScreen({ siteName, categories, allImages }: { siteName: string; categories: Category[]; allImages: AdminImage[] }) {
  const [title, excerpt, categoryId, body] = useWatch<BaseComposerValues & { body?: string }>({
    name: ["title", "excerpt", "categoryId", "body"],
  }) as string[];
  const images = useWatch<BaseComposerValues, "images">({ name: "images" }) as ContentImage[] | undefined;
  const videos = (useWatch({ name: "videos" }) as ContentVideoInput[] | undefined) ?? [];
  const urls = previewImageUrls(images, allImages);
  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  const videoIds = videos.map((v) => youtubeVideoId(v.url)).filter((id): id is string => Boolean(id));

  return (
    // Marco de teléfono: 375 px de ancho (un celular común) y la pantalla con scroll propio.
    <div className="mt-4 min-h-0 w-[min(375px,100%)] flex-1 overflow-hidden rounded-[2.5rem] border-[10px] border-slate-900 bg-slate-900 shadow-overlay">
      <div aria-hidden="true" className="mx-auto mb-1 h-5 w-24 rounded-b-2xl bg-slate-900" />
      <div className="h-[min(70dvh,680px)] overflow-y-auto overscroll-contain rounded-[1.75rem] bg-canvas" inert>
        <p className="truncate px-4 py-2 text-xs font-semibold text-foreground">
          {siteName}
          {categoryName && <span className="font-normal text-muted"> · {categoryName}</span>}
        </p>
        {urls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa de fotos propias o enlaces ya guardados
          <img src={urls[0]} alt="" className="aspect-[4/5] w-full object-cover" />
        ) : videoIds[0] ? (
          <VideoThumb id={videoIds[0]} />
        ) : null}
        <div className="px-4 pt-4 pb-6">
          <h1 className="text-2xl leading-tight font-extrabold text-balance text-foreground">{title || "Título"}</h1>
          {excerpt && <p className="mt-2 text-base leading-relaxed font-medium text-foreground">{excerpt}</p>}

          {urls.length > 1 && (
            <div className="-mx-4 mt-4 flex gap-1 overflow-x-auto px-4">
              {urls.slice(1).map((url) => (
                // eslint-disable-next-line @next/next/no-img-element -- vista previa
                <img key={url} src={url} alt="" className="aspect-square w-40 shrink-0 rounded-control object-cover" />
              ))}
            </div>
          )}
          {videoIds.slice(urls[0] ? 0 : 1).map((id) => (
            <div key={id} className="mt-4 overflow-hidden rounded-control">
              <VideoThumb id={id} />
            </div>
          ))}

          {/* El texto viene del editor del panel (Tiptap): mismo HTML que guarda el backend, que además lo sanea. */}
          {body && <div className={`${PHONE_PROSE} mt-4`} dangerouslySetInnerHTML={{ __html: body }} />}

          <div className="mt-6 rounded-card bg-surface p-3 shadow-card">
            <p className="text-sm font-bold text-foreground">¿Qué te pareció?</p>
            <div className="mt-2 grid grid-cols-4 gap-1">
              {REACTION_PREVIEW.map(({ icon: ReactionIcon, label, color }) => (
                <div key={label} className="flex flex-col items-center gap-1 text-[11px] text-muted">
                  <span className={`flex size-9 items-center justify-center rounded-full bg-linear-to-br text-white ${color}`}>
                    <ReactionIcon weight="fill" className="size-5" />
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoThumb({ id }: { id: string }) {
  return (
    <div className="relative aspect-video w-full bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube */}
      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-90" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white">
          <Play weight="fill" className="size-6" />
        </span>
      </span>
    </div>
  );
}
