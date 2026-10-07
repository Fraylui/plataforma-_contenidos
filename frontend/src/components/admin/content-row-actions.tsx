"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ChatCircleText, DotsThree, PaperPlaneTilt, PencilSimple } from "@phosphor-icons/react";
import {
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
import { Button, Field, IconButton, TextArea } from "@/components/ui";
import { publicationStepAction } from "@/app/admin/(protected)/publication-actions";
import type { PublicationKind, PublicationPermissions, PublicationStep } from "@/lib/admin/publication";
import type { PublicationStatus } from "@/lib/api/types";

const ICON_LINK =
  "flex size-8 items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-field hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring";

/**
 * Acciones rápidas del flujo desde un listado, iguales para los 5 tipos de
 * contenido: editar y, en el menú, enviar para aprobar, publicar, devolver
 * a borrador (con nota) y archivar — según permiso y estado.
 */
export function ContentRowActions({
  kind,
  id,
  status,
  editHref,
  permissions,
  itemLabel,
}: {
  kind: PublicationKind;
  id: string;
  status: PublicationStatus;
  editHref: string;
  permissions: PublicationPermissions;
  itemLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [note, setNote] = useState("");

  async function run(step: PublicationStep, body?: { note?: string }) {
    setPending(true);
    const result = await publicationStepAction(kind, id, step, body);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  const canReturnWithNote = permissions.canReturnToDraft && status === "IN_REVIEW";
  const hasAnyAction = permissions.canSubmit || permissions.canPublish || canReturnWithNote || permissions.canArchive;

  return (
    <div className="flex items-center justify-end gap-1">
      <Link href={editHref} className={ICON_LINK} title="Editar">
        <PencilSimple className="size-4" aria-hidden="true" />
        <span className="sr-only">Editar</span>
      </Link>

      {hasAnyAction && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton label="Más acciones" size="sm" disabled={pending} icon={<DotsThree weight="bold" aria-hidden="true" />} />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {permissions.canSubmit && (
              <DropdownMenuItem onSelect={() => run("submit")}>
                <PaperPlaneTilt aria-hidden="true" />
                Enviar para aprobar
              </DropdownMenuItem>
            )}
            {permissions.canPublish && (
              <DropdownMenuItem onSelect={() => run("publish")}>
                <PaperPlaneTilt weight="fill" aria-hidden="true" />
                Publicar ahora
              </DropdownMenuItem>
            )}
            {canReturnWithNote && (
              <DropdownMenuItem onSelect={() => setReturnOpen(true)}>
                <ChatCircleText aria-hidden="true" />
                Devolver a borrador
              </DropdownMenuItem>
            )}
            {permissions.canArchive && (
              <>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem variant="danger" onSelect={(e) => e.preventDefault()}>
                      <Archive aria-hidden="true" />
                      Archivar
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogTitle>¿Archivar {itemLabel}?</AlertDialogTitle>
                    <AlertDialogDescription>Dejará de aparecer en el sitio público. No se puede deshacer desde acá.</AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogCancel asChild>
                        <Button variant="secondary">Cancelar</Button>
                      </AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button variant="danger" onClick={() => run("archive")}>
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

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogTitle>Devolver a borrador</DialogTitle>
          <DialogDescription>Quien creó {itemLabel} podrá corregirlo y volver a enviarlo.</DialogDescription>
          <Field label="Nota para quien lo creó (opcional)" name={`return-note-${id}`} className="mt-4">
            <TextArea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setReturnOpen(false)}>
              Cancelar
            </Button>
            <Button
              loading={pending}
              onClick={async () => {
                if (await run("return-to-draft", { note: note.trim() || undefined })) {
                  setReturnOpen(false);
                  setNote("");
                }
              }}
            >
              Devolver
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
