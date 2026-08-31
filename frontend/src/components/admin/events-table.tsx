"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Event } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computeEventPermissions } from "@/lib/admin/event-permissions";
import { articleStatusLabel, articleStatusTone, formatEventDateTime } from "@/lib/content-labels";
import { StatusPill, DataTable } from "@/components/admin/ui";
import { EditorialRowActions } from "@/components/admin/editorial-row-actions";
import {
  approveEventAction,
  archiveEventAction,
  publishEventAction,
  rejectEventAction,
  submitEventAction,
} from "@/app/admin/(protected)/eventos/actions";

export function EventsTable({ events, currentUser }: { events: Event[]; currentUser: AdminUser }) {
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
        cell: ({ row }) => <StatusPill tone={articleStatusTone(row.original.status)} label={articleStatusLabel(row.original.status)} />,
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <EditorialRowActions
            id={row.original.id}
            editHref={`/admin/eventos/${row.original.id}`}
            permissions={computeEventPermissions(row.original, currentUser)}
            itemLabel="este evento"
            actions={{
              submit: submitEventAction,
              approve: approveEventAction,
              reject: rejectEventAction,
              publish: publishEventAction,
              archive: archiveEventAction,
            }}
          />
        ),
      },
    ],
    [currentUser],
  );

  return <DataTable columns={columns} data={events} searchPlaceholder="Buscar eventos…" emptyMessage="Ningún evento coincide con la búsqueda." />;
}
