"use client";

import { useTransition } from "react";
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
 * Botón de una acción que no se deshace (eliminar) con confirmación previa.
 * `action` es una Server Action ya ligada a su registro (action.bind(null, id)).
 */
export function ConfirmActionButton({
  action,
  label,
  title,
  description,
}: {
  action: () => Promise<void> | void;
  label: string;
  title: string;
  description: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={pending}
          className="min-h-11 cursor-pointer px-1 text-xs font-medium text-muted underline underline-offset-2 hover:text-danger-ink disabled:opacity-50"
        >
          {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="secondary">Cancelar</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="danger" onClick={() => startTransition(async () => { await action(); })}>
              Sí, {label.toLowerCase()}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
