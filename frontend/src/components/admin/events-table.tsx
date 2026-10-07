"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Event } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, formatEventDateTime } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

export function EventsTable({ events, currentUser }: { events: Event[]; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Event[]>([]);

  const columns = useMemo<ColumnDef<Event, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <Link href={`/admin/eventos/${row.original.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
            {row.original.title}
          </Link>
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
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <ContentRowActions
            id={row.original.id}
            editHref={`/admin/eventos/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "events")}
            itemLabel="este evento"
          kind="events"
          status={row.original.status}
          />
        ),
      },
    ],
    [currentUser],
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
        data={events}
        searchPlaceholder="Buscar eventos…"
        emptyMessage="Ningún evento coincide con la búsqueda."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
