"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminUser } from "@/lib/api/admin-types";
import { roleLabel } from "@/lib/admin/role-labels";
import { formatPublishedDate } from "@/lib/content-labels";
import { StatusPill, DataTable } from "@/components/admin/ui";
import { UserRowActions } from "@/components/admin/user-row-actions";

export function UsersTable({ users, viewer }: { users: AdminUser[]; viewer: AdminUser }) {
  const columns = useMemo<ColumnDef<AdminUser, unknown>[]>(
    () => [
      {
        id: "user",
        header: "Usuario",
        accessorFn: (row) => `${row.firstName} ${row.lastName} ${row.email}`,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">
              {row.original.firstName} {row.original.lastName}
              {row.original.id === viewer.id && <span className="ml-1.5 text-xs font-normal text-muted">(tú)</span>}
            </p>
            <p className="text-xs text-muted">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Rol",
        cell: ({ row }) => <span className="text-muted">{roleLabel(row.original.role)}</span>,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <StatusPill
            tone={row.original.status === "ACTIVE" ? "success" : "neutral"}
            label={row.original.status === "ACTIVE" ? "Activo" : "Desactivado"}
          />
        ),
      },
      {
        accessorKey: "mfaEnabled",
        header: "MFA",
        cell: ({ row }) => <span className="text-muted">{row.original.mfaEnabled ? "Sí" : "No"}</span>,
      },
      {
        accessorKey: "lastLoginAt",
        header: "Último acceso",
        cell: ({ row }) => <span className="text-muted">{row.original.lastLoginAt ? formatPublishedDate(row.original.lastLoginAt) : "Nunca"}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original;
          const isSelf = user.id === viewer.id;
          const cannotManage = (isSelf && user.status === "ACTIVE") || (user.role === "SUPER_ADMIN" && viewer.role !== "SUPER_ADMIN");
          if (cannotManage) return null;
          return (
            <UserRowActions userId={user.id} active={user.status === "ACTIVE"} displayName={`${user.firstName} ${user.lastName}`} />
          );
        },
      },
    ],
    [viewer],
  );

  return <DataTable columns={columns} data={users} searchPlaceholder="Buscar usuarios…" emptyMessage="Ningún usuario coincide con la búsqueda." />;
}
