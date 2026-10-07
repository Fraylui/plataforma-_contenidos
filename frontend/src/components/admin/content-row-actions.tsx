"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, CheckCircle, DotsThree, PencilSimple, PaperPlaneTilt, ArrowCounterClockwise, XCircle } from "@phosphor-icons/react";
import type { ActionResult } from "@/lib/admin/action-helpers";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger, Dialog, DialogContent, DialogDescription, DialogTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/admin/ui";
import { Button, TextArea } from "@/components/ui";

export interface ContentPermissions {
  canSubmit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPublish: boolean;
  canArchive: boolean;
}

export interface ContentActions {
  submit: (id: string) => Promise<ActionResult>;
  approve: (id: string) => Promise<ActionResult>;
  reject: (id: string, reason: string) => Promise<ActionResult>;
  publish: (id: string) => Promise<ActionResult>;
  archive: (id: string) => Promise<ActionResult>;
}

/**
 * Acciones rápidas de flujo de publicación desde un listado — genérico para
 * Publicaciones/Lugares/Eventos/Galerías/Directorio, que comparten
 * el mismo ciclo (ver ArticleStatus/PlaceStatus/etc. en el backend, todos
 * idénticos). Un solo componente en vez de 6 copias casi iguales.
 */
export function ContentRowActions({
  id,
  editHref,
  permissions,
  actions,
  itemLabel,
}: {
  id: string;
  editHref: string;
  permissions: ContentPermissions;
  actions: ContentActions;
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
        <PencilSimple className="h-4 w-4" aria-hidden="true" />
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
              <DotsThree className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Más acciones</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {permissions.canSubmit && (
              <DropdownMenuItem onSelect={() => run(() => actions.submit(id))}>
                <PaperPlaneTilt className="h-4 w-4" aria-hidden="true" />
                Enviar a revisión
              </DropdownMenuItem>
            )}
            {permissions.canApprove && (
              <DropdownMenuItem onSelect={() => run(() => actions.approve(id))}>
                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                Aprobar
              </DropdownMenuItem>
            )}
            {permissions.canPublish && (
              <DropdownMenuItem onSelect={() => run(() => actions.publish(id))}>
                <ArrowCounterClockwise className="h-4 w-4 rotate-180" aria-hidden="true" />
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
                        <Button type="button" variant="secondary">
                          Cancelar
                        </Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button type="button" variant="danger" onClick={() => run(() => actions.archive(id))}>
                          Archivar
                        </Button>
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
          <TextArea
            aria-label="Motivo de rechazo"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="mt-4"
            placeholder="Motivo de rechazo"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancelar
            </Button>
            <Button
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
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
