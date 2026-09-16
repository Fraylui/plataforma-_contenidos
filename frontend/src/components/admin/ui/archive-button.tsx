import { AdminButton } from "./admin-button";
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
        <AdminButton type="button" variant="secondary" disabled={disabled}>
          Archivar
        </AdminButton>
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
            <AdminButton type="button" variant="danger" onClick={onConfirm}>
              Archivar
            </AdminButton>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
