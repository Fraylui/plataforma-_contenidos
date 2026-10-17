"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";
import { X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const Dialog = RadixDialog.Root;

export function DialogContent({ className, children, ...props }: ComponentProps<typeof RadixDialog.Content>) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-modal bg-surface p-6 shadow-overlay",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full text-muted outline-none transition-colors hover:bg-field hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring">
          <X className="size-4" aria-hidden="true" />
          <span className="sr-only">Cerrar</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof RadixDialog.Title>) {
  return <RadixDialog.Title className={cn("text-lg font-semibold tracking-tight text-foreground", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof RadixDialog.Description>) {
  return <RadixDialog.Description className={cn("mt-1 text-sm text-muted", className)} {...props} />;
}
