"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Place } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computePlacePermissions } from "@/lib/admin/place-permissions";
import { articleStatusLabel, articleStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { StatusPill, DataTable } from "@/components/admin/ui";
import { EditorialRowActions } from "@/components/admin/editorial-row-actions";
import {
  approvePlaceAction,
  archivePlaceAction,
  publishPlaceAction,
  rejectPlaceAction,
  submitPlaceAction,
} from "@/app/admin/(protected)/lugares/actions";

export function PlacesTable({ places, currentUser }: { places: Place[]; currentUser: AdminUser }) {
  const columns = useMemo<ColumnDef<Place, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <Link href={`/admin/lugares/${row.original.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
            {row.original.name}
          </Link>
        ),
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
            editHref={`/admin/lugares/${row.original.id}`}
            permissions={computePlacePermissions(row.original, currentUser)}
            itemLabel="este lugar"
            actions={{
              submit: submitPlaceAction,
              approve: approvePlaceAction,
              reject: rejectPlaceAction,
              publish: publishPlaceAction,
              archive: archivePlaceAction,
            }}
          />
        ),
      },
    ],
    [currentUser],
  );

  return <DataTable columns={columns} data={places} searchPlaceholder="Buscar lugares…" emptyMessage="Ningún lugar coincide con la búsqueda." />;
}
