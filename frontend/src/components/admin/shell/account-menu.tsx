"use client";

import Link from "next/link";
import { ArrowSquareOut, SignOut, UserCircle } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/admin/ui";
import { logoutAction } from "@/app/admin/(protected)/actions";

/** Avatar con las iniciales y el menú de la cuenta (Mi cuenta, ver el sitio, cerrar sesión). */
export function AccountMenu({
  firstName,
  lastName,
  email,
  roleLabel,
}: {
  firstName: string;
  lastName: string;
  email: string;
  roleLabel: string;
}) {
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Cuenta de ${fullName}`}
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent outline-none transition-shadow hover:shadow-card focus-visible:ring-[3px] focus-visible:ring-ring"
        >
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
          <p className="truncate text-xs text-muted">{email}</p>
          <p className="mt-1 text-xs font-medium text-accent">{roleLabel}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/cuenta">
            <UserCircle aria-hidden="true" />
            Mi cuenta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/" target="_blank" rel="noopener">
            <ArrowSquareOut aria-hidden="true" />
            Ver el sitio
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <DropdownMenuItem asChild variant="danger">
            <button type="submit" className="w-full">
              <SignOut aria-hidden="true" />
              Cerrar sesión
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
