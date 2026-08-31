"use client";

import { useState } from "react";
import { MoreHorizontal, UserCheck, UserX } from "lucide-react";
import { setUserActiveAction } from "@/app/admin/(protected)/usuarios/actions";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/admin/ui";

export function UserRowActions({ userId, active, displayName }: { userId: string; active: boolean; displayName: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(nextActive: boolean) {
    setPending(true);
    setError(null);
    try {
      await setUserActiveAction(userId, nextActive);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-danger">{error}</span>}
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
          {active ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem variant="danger" onSelect={(e) => e.preventDefault()}>
                  <UserX className="h-4 w-4" aria-hidden="true" />
                  Desactivar
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>¿Desactivar a {displayName}?</AlertDialogTitle>
                <AlertDialogDescription>No podrá iniciar sesión hasta que lo reactives.</AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <AdminButton type="button" variant="secondary">
                      Cancelar
                    </AdminButton>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <AdminButton type="button" variant="danger" onClick={() => toggle(false)}>
                      Desactivar
                    </AdminButton>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <DropdownMenuItem onSelect={() => toggle(true)}>
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              Activar
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
