"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, CloudArrowUp, Spinner, WarningCircle } from "@phosphor-icons/react";
import { uploadImageAction } from "@/app/admin/(protected)/imagenes/actions";

type UploadState = "pending" | "uploading" | "done" | "error";

interface UploadItem {
  key: string;
  name: string;
  state: UploadState;
  error?: string;
}

/**
 * Subida de imágenes: arrastrar y soltar o elegir varias a la vez. Se suben
 * una por una (el backend limita la cantidad de subidas por ventana de
 * tiempo, ver ImageUploadRateLimiter) y cada archivo muestra su estado. El
 * texto alternativo se escribe después en la tarjeta de cada imagen.
 */
export function ImageUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [items, setItems] = useState<UploadItem[]>([]);
  const busy = items.some((item) => item.state === "pending" || item.state === "uploading");

  function update(key: string, patch: Partial<UploadItem>) {
    setItems((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  async function upload(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    const batch = images.map((file, i) => ({ file, key: `${Date.now()}-${i}-${file.name}` }));
    setItems(batch.map(({ file, key }) => ({ key, name: file.name, state: "pending" })));
    let uploaded = 0;
    for (const { file, key } of batch) {
      update(key, { state: "uploading" });
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadImageAction(formData);
      if (result.ok) {
        uploaded++;
        update(key, { state: "done" });
      } else {
        update(key, { state: "error", error: result.error });
      }
    }
    if (uploaded > 0) router.refresh();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (busy) return;
    void upload(Array.from(event.dataTransfer.files));
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Subir imágenes: suelta archivos aquí o presiona para elegirlos"
        aria-disabled={busy}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !busy) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--ring)] ${
          dragging ? "border-accent bg-accent-soft" : "border-field-border bg-surface hover:border-accent/60"
        } ${busy ? "cursor-progress opacity-70" : ""}`}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <CloudArrowUp weight="fill" className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-foreground">
          {dragging ? "Suelta para subir" : "Arrastra tus fotos aquí o haz clic para elegirlas"}
        </p>
        <p className="text-xs text-muted">Puedes elegir varias a la vez · JPG, PNG o WebP</p>
      </div>
      {/* Fuera del botón (un control no puede ir dentro de otro) y oculto: el botón de arriba lo abre y lo representa. */}
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void upload(files);
        }}
      />

      {items.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-live="polite">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              {item.state === "done" ? (
                <CheckCircle weight="fill" className="size-4 shrink-0 text-success" aria-hidden="true" />
              ) : item.state === "error" ? (
                <WarningCircle weight="fill" className="size-4 shrink-0 text-danger-ink" aria-hidden="true" />
              ) : (
                <Spinner className={`size-4 shrink-0 text-muted ${item.state === "uploading" ? "animate-spin" : ""}`} aria-hidden="true" />
              )}
              <span className="min-w-0 truncate text-foreground">{item.name}</span>
              <span className="shrink-0 text-xs text-muted">
                {item.state === "pending" && "En espera"}
                {item.state === "uploading" && "Subiendo…"}
                {item.state === "done" && "Subida"}
                {item.state === "error" && (item.error ?? "No se pudo subir")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
