"use client";

/* eslint-disable @next/next/no-img-element -- vista previa de la portada: URL subida o externa, sin optimizar */
import { useWatch } from "react-hook-form";
import { ImageSquare } from "@phosphor-icons/react";
import type { Category } from "@/lib/api/types";
import { Card } from "@/components/ui";
import type { BaseComposerValues } from "./schema";

/** Cómo se verá la tarjeta en el feed mientras se escribe (sin me gusta ni compartir: aún no existe). */
export function FeedCardPreview({
  siteName,
  coverUrl,
  categories,
  meta,
}: {
  siteName: string;
  coverUrl: string | null;
  categories: Category[];
  /** Línea extra bajo el título (p. ej. la fecha de un evento). */
  meta?: string | null;
}) {
  const [title, excerpt, categoryId] = useWatch<BaseComposerValues>({ name: ["title", "excerpt", "categoryId"] }) as string[];
  const categoryName = categories.find((category) => category.id === categoryId)?.name;
  return (
    <Card title="Vista previa en el feed">
      <div className="overflow-hidden rounded-control bg-canvas">
        <p className="truncate px-3 py-2 text-xs font-semibold text-foreground">
          {siteName}
          {categoryName && <span className="font-normal text-muted"> · {categoryName}</span>}
        </p>
        <div className="flex aspect-square items-center justify-center bg-canvas-strong">
          {coverUrl ? (
            <img src={coverUrl} alt="" className="size-full object-cover" />
          ) : (
            <ImageSquare aria-hidden="true" className="size-10 text-muted/60" />
          )}
        </div>
        <div className="space-y-0.5 px-3 py-2.5">
          <p className="line-clamp-2 text-sm font-bold text-foreground">{title || "Título"}</p>
          {meta && <p className="text-xs font-medium text-accent">{meta}</p>}
          {excerpt && <p className="line-clamp-2 text-xs text-muted">{excerpt}</p>}
        </div>
      </div>
    </Card>
  );
}
