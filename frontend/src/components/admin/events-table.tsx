"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { Event } from "@/lib/api/types";
import type { AdminContentPage, AdminUser } from "@/lib/api/admin-types";
import { EngagementCell, TitleCell } from "@/components/admin/content-cells";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, formatEventDateTime } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

/** Columna → campo de orden del backend (AdminListQuery). */
const SORT_KEYS: Record<string, string> = { title: "title", status: "status", startsAt: "startsAt" };

export function EventsTable({ page, currentUser }: { page: AdminContentPage<Event>; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Event[]>([]);

  const columns = useMemo<ColumnDef<Event, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <TitleCell href={`/admin/eventos/${row.original.id}`} title={row.original.title} images={row.original.images} />
        ),
      },
      {
        accessorKey: "startsAt",
        header: "Fecha",
        cell: ({ row }) => <span className="text-muted">{formatEventDateTime(row.original.startsAt)}</span>,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <Badge tone={publicationStatusTone(row.original.status)} dot>{publicationStatusLabel(row.original.status)}</Badge>,
      },
      {
        id: "engagement",
        header: "Interacción",
        cell: ({ row }) => <EngagementCell counts={page.engagement[row.original.id]} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <ContentRowActions
            id={row.original.id}
            editHref={`/admin/eventos/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "events")}
            itemLabel="esta fecha"
          kind="events"
          />
        ),
      },
    ],
    [currentUser, page.engagement],
  );

  return (
    <div>
      <ContentBulkActions
        selected={selected}
        permissions={{
          canPublish: (item) => computePublicationPermissions(item, currentUser, "events").canPublish,
          canArchive: (item) => computePublicationPermissions(item, currentUser, "events").canArchive,
        }}
        kind="events"
        onDone={() => router.refresh()}
      />
      <DataTable
        columns={columns}
        data={page.items}
        serverPage={page}
        sortKeys={SORT_KEYS}
        searchPlaceholder="Buscar fechas…"
        emptyMessage="Ninguna fecha coincide con la búsqueda."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
