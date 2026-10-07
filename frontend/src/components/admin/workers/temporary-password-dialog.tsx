"use client";

import { useState } from "react";
import { Check, Copy, Key } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/admin/ui";
import { Button } from "@/components/ui";

/**
 * Contraseña temporal recién creada o restablecida: se muestra una sola vez
 * (el servidor solo guarda su hash). El trabajador la cambia en su primer
 * ingreso.
 */
export function TemporaryPasswordDialog({ name, password, onClose }: { name: string; password: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Key className="h-6 w-6" weight="fill" aria-hidden="true" />
        </div>
        <DialogTitle className="mt-4">Contraseña temporal de {name}</DialogTitle>
        <DialogDescription className="mt-1">
          Compártela por un medio seguro. En su primer ingreso tendrá que elegir una propia. No se volverá a mostrar.
        </DialogDescription>
        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-canvas-strong p-2 pl-4">
          <code className="flex-1 font-mono text-base font-semibold tracking-wider break-all text-foreground">{password}</code>
          <Button type="button" variant="secondary" onClick={() => void copy()}>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? "Copiada" : "Copiar"}
          </Button>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={onClose}>
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
