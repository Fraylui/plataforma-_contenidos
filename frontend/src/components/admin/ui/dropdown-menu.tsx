"use client";

import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = RadixDropdownMenu.Root;
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger;

export function DropdownMenuContent({ className, ...props }: ComponentProps<typeof RadixDropdownMenu.Content>) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        align="end"
        sideOffset={6}
        className={cn(
          "z-50 min-w-[11rem] overflow-hidden rounded-card bg-surface p-1.5 shadow-pop",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  );
}

export function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof RadixDropdownMenu.Item> & { variant?: "default" | "danger" }) {
  return (
    <RadixDropdownMenu.Item
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-sm font-medium outline-none transition-colors [&_svg]:size-4",
        "data-[highlighted]:bg-field",
        variant === "danger" && "text-danger-ink data-[highlighted]:bg-danger-soft",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof RadixDropdownMenu.Separator>) {
  return <RadixDropdownMenu.Separator className={cn("my-1 h-px bg-field-border", className)} {...props} />;
}
