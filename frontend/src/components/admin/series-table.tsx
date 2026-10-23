"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { PageResponse } from "@/lib/api/types";
import type { AdminSeries, AdminUser } from "@/lib/api/admin-types";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { formatPublishedDate, publicationStatusLabel, publicationStatusTone } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { TitleCell } from "@/components/admin/content-cells";
import { Badge } from "@/components/ui";

/** Columna → campo de orden del backend (AdminListQuery). */
const SORT_KEYS: Record<string, string> = { title: "title", status: "status", createdAt: "createdAt" };

/** Series del panel: estado, cómo va la sincronización con YouTube y acciones del flujo. */
export function SeriesTable({ page, currentUser }: { page: PageResponse<AdminSeries>; currentUser: AdminUser }) {
  const columns = useMemo<ColumnDef<AdminSeries, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Serie",
        cell: ({ row }) => <TitleCell href={`/admin/series/${row.original.id}`} title={row.original.title} images={[]} />,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <Badge tone={publicationStatusTone(row.original.status)} dot>
            {publicationStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: "sync",
        header: "YouTube",
        cell: ({ row }) =>
          row.original.lastSyncError ? (
            <Badge tone="danger" dot>
              Revisar conexión
            </Badge>
          ) : (
            <span className="text-xs text-muted">
              {row.original.lastSyncedAt ? `Al día · ${formatPublishedDate(row.original.lastSyncedAt)}` : "Sin sincronizar"}
            </span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: "Creada",
        cell: ({ row }) => <span className="text-muted">{formatPublishedDate(row.original.createdAt)}</span>,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ContentRowActions
            id={row.original.id}
            editHref={`/admin/series/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "series")}
            itemLabel="esta serie"
            kind="series"
          />
        ),
      },
    ],
    [currentUser],
  );

  return (
    <DataTable
      columns={columns}
      data={page.items}
      serverPage={page}
      sortKeys={SORT_KEYS}
      searchPlaceholder="Buscar series…"
      emptyMessage="Ninguna serie coincide con la búsqueda o el filtro."
    />
  );
}
