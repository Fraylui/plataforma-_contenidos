import { Archive } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";

/**
 * Botón "Archivar" con confirmación — mismo AlertDialog que ya usa
 * ContentRowActions desde el listado. Antes el formulario de edición
 * archivaba directo al clic, sin confirmar, mientras la misma acción desde
 * la tabla sí pedía confirmación: mismo destino, dos comportamientos.
 */
export function ArchiveButton({
  itemLabel,
  disabled,
  onConfirm,
}: {
  itemLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" disabled={disabled} icon={<Archive aria-hidden="true" />}>
          Archivar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>¿Archivar {itemLabel}?</AlertDialogTitle>
        <AlertDialogDescription>
          Dejará de aparecer en el sitio público. No se puede deshacer desde acá.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary">Cancelar</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="danger" onClick={onConfirm}>
              Archivar
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
