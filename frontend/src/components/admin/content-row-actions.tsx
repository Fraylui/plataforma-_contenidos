"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, DotsThree, PaperPlaneTilt, PencilSimple, X } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui";
import { Button, IconButton } from "@/components/ui";
import { publicationStepAction } from "@/app/admin/(protected)/publication-actions";
import type { PublicationKind, PublicationPermissions, PublicationStep } from "@/lib/admin/publication";

const ICON_LINK =
  "flex size-8 items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-field hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring";

/**
 * Acciones rápidas del flujo desde un listado, iguales para los 5 tipos de
 * contenido: editar y, en el menú, publicar, quitar la programación y
 * archivar — según el estado (quien tiene el módulo publica directo).
 */
export function ContentRowActions({
  kind,
  id,
  editHref,
  permissions,
  itemLabel,
}: {
  kind: PublicationKind;
  id: string;
  editHref: string;
  permissions: PublicationPermissions;
  itemLabel: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function run(step: PublicationStep) {
    setPending(true);
    const result = await publicationStepAction(kind, id, step);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return false;
    }
    router.refresh();
    return true;
  }

  const hasAnyAction = permissions.canPublish || permissions.canReturnToDraft || permissions.canArchive;

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
            {permissions.canPublish && (
              <DropdownMenuItem onSelect={() => run("publish")}>
                <PaperPlaneTilt weight="fill" aria-hidden="true" />
                Publicar ahora
              </DropdownMenuItem>
            )}
            {permissions.canReturnToDraft && (
              <DropdownMenuItem onSelect={() => run("return-to-draft")}>
                <X aria-hidden="true" />
                Quitar programación
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
    </div>
  );
}
