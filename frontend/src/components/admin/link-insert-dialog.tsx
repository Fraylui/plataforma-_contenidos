"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AdminButton, Dialog, DialogContent, DialogDescription, DialogTitle, formInputClass } from "@/components/admin/ui";

/**
 * Modal para insertar/editar el enlace de un texto seleccionado — antes
 * `window.prompt()` nativo, sin estilo y bloqueando el hilo, mientras el
 * botón de imagen de la misma barra (ver ImageInsertDialog) ya abría un
 * diálogo propio del sistema. Mismo patrón acá para que la barra sea
 * consistente consigo misma.
 */
export function LinkInsertDialog({
  open,
  onOpenChange,
  currentUrl,
  onConfirm,
  onRemove,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string | undefined;
  onConfirm: (url: string) => void;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState(currentUrl ?? "");

  useEffect(() => {
    if (open) setUrl(currentUrl ?? "");
  }, [open, currentUrl]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!url.trim()) return;
    onConfirm(url.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>{currentUrl ? "Editar enlace" : "Insertar enlace"}</DialogTitle>
        <DialogDescription>Se aplica al texto seleccionado.</DialogDescription>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">URL</span>
            <input
              type="url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className={formInputClass}
            />
          </label>

          <div className="flex items-center justify-between gap-2">
            {currentUrl ? (
              <AdminButton
                type="button"
                variant="secondary"
                onClick={() => {
                  onRemove();
                  onOpenChange(false);
                }}
              >
                Quitar enlace
              </AdminButton>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <AdminButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancelar
              </AdminButton>
              <AdminButton type="submit" disabled={!url.trim()}>
                {currentUrl ? "Guardar" : "Insertar"}
              </AdminButton>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
