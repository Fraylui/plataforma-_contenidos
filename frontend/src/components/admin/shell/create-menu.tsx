"use client";

import Link from "next/link";
import { Plus } from "@phosphor-icons/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/admin/ui";
import { Button } from "@/components/ui";
import type { CreateItem } from "@/lib/admin/nav";

/** Botón «Crear» de la barra superior: los tipos que la persona puede crear. */
export function CreateMenu({ items, className }: { items: CreateItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" icon={<Plus weight="bold" aria-hidden="true" />} className={className}>
          Crear
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
