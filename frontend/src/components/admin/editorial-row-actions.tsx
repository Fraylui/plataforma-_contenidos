"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, CheckCircle2, MoreHorizontal, Pencil, Send, Undo2, XCircle } from "lucide-react";
import type { ActionResult } from "@/lib/admin/action-helpers";
import {
  AdminButton,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui";

export interface EditorialPermissions {
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canArchive: boolean;
}

export interface EditorialActions {
  submit: (id: string) => Promise<ActionResult>;
  approve: (id: string) => Promise<ActionResult>;
  reject: (id: string, reason: string) => Promise<ActionResult>;
  publish: (id: string) => Promise<ActionResult>;
  archive: (id: string) => Promise<ActionResult>;
}

/**
 * Acciones rápidas de flujo editorial desde un listado — genérico para
 * Publicaciones/Lugares/Eventos/Galerías/Reseñas/Directorio, que comparten
 * el mismo ciclo (ver ArticleStatus/PlaceStatus/etc. en el backend, todos
 * idénticos). Un solo componente en vez de 6 copias casi iguales.
 */
export function EditorialRowActions({
  id,
  editHref,
  permissions,
  actions,
  itemLabel,
}: {
  id: string;
  editHref: string;
  permissions: EditorialPermissions;
  actions: EditorialActions;
  itemLabel: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function run(action: () => Promise<ActionResult>) {
    setPending(true);
    setError(null);
    const result = await action();
    setPending(false);
    if (!result.ok) setError(result.error);
  }

  const hasAnyAction = permissions.canSubmit || permissions.canApprove || permissions.canReject || permissions.canPublish || permissions.canArchive;

  return (
    <div className="flex items-center justify-end gap-1">
      {error && <span className="text-xs text-danger">{error}</span>}
      <Link href={editHref} className="rounded-md p-1.5 text-muted transition-colors hover:bg-accent-soft hover:text-accent" title="Editar">
        <Pencil className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Editar</span>
      </Link>

      {hasAnyAction && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={pending}
              className="rounded-md p-1.5 text-muted transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-40"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Más acciones</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {permissions.canSubmit && (
              <DropdownMenuItem onSelect={() => run(() => actions.submit(id))}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Enviar a revisión
              </DropdownMenuItem>
            )}
            {permissions.canApprove && (
              <DropdownMenuItem onSelect={() => run(() => actions.approve(id))}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Aprobar
              </DropdownMenuItem>
            )}
            {permissions.canPublish && (
              <DropdownMenuItem onSelect={() => run(() => actions.publish(id))}>
                <Undo2 className="h-4 w-4 rotate-180" aria-hidden="true" />
                Publicar ahora
              </DropdownMenuItem>
            )}
            {permissions.canReject && (
              <DropdownMenuItem onSelect={() => setRejectOpen(true)}>
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Rechazar
              </DropdownMenuItem>
            )}
            {permissions.canArchive && (
              <>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem variant="danger" onSelect={(e) => e.preventDefault()}>
                      <Archive className="h-4 w-4" aria-hidden="true" />
                      Archivar
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>¿Archivar {itemLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Dejará de aparecer en el sitio público. No se puede deshacer desde acá.
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel asChild>
                        <AdminButton type="button" variant="secondary">
                          Cancelar
                        </AdminButton>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <AdminButton type="button" variant="danger" onClick={() => run(() => actions.archive(id))}>
                          Archivar
                        </AdminButton>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogTitle>Rechazar {itemLabel}</DialogTitle>
          <DialogDescription>Explica brevemente el motivo — el autor lo verá para corregirlo.</DialogDescription>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="mt-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-accent"
            placeholder="Motivo de rechazo"
          />
          <div className="mt-4 flex justify-end gap-2">
            <AdminButton type="button" variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancelar
            </AdminButton>
            <AdminButton
              type="button"
              variant="danger"
              disabled={!rejectReason.trim() || pending}
              onClick={async () => {
                await run(() => actions.reject(id, rejectReason));
                setRejectOpen(false);
                setRejectReason("");
              }}
            >
              Rechazar
            </AdminButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
