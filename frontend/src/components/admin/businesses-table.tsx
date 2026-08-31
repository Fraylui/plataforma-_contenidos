"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Business } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computeBusinessPermissions } from "@/lib/admin/business-permissions";
import { articleStatusLabel, articleStatusTone, businessTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { StatusPill, DataTable } from "@/components/admin/ui";
import { EditorialRowActions } from "@/components/admin/editorial-row-actions";
import {
  approveBusinessAction,
  archiveBusinessAction,
  publishBusinessAction,
  rejectBusinessAction,
  submitBusinessAction,
} from "@/app/admin/(protected)/directorio/actions";

export function BusinessesTable({ businesses, currentUser }: { businesses: Business[]; currentUser: AdminUser }) {
  const columns = useMemo<ColumnDef<Business, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <Link href={`/admin/directorio/${row.original.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: "businessType",
        header: "Tipo",
        cell: ({ row }) => <span className="text-muted">{businessTypeLabel(row.original.businessType)}</span>,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <StatusPill tone={articleStatusTone(row.original.status)} label={articleStatusLabel(row.original.status)} />,
      },
      {
        accessorKey: "createdAt",
        header: "Creado",
        cell: ({ row }) => <span className="text-muted">{formatPublishedDate(row.original.createdAt)}</span>,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <EditorialRowActions
            id={row.original.id}
            editHref={`/admin/directorio/${row.original.id}`}
            permissions={computeBusinessPermissions(row.original, currentUser)}
            itemLabel="esta ficha"
            actions={{
              submit: submitBusinessAction,
              approve: approveBusinessAction,
              reject: rejectBusinessAction,
              publish: publishBusinessAction,
              archive: archiveBusinessAction,
            }}
          />
        ),
      },
    ],
    [currentUser],
  );

  return (
    <DataTable columns={columns} data={businesses} searchPlaceholder="Buscar en el directorio…" emptyMessage="Ninguna ficha coincide con la búsqueda." />
  );
}
