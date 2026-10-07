"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Place } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

export function PlacesTable({ places, currentUser }: { places: Place[]; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Place[]>([]);

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
        cell: ({ row }) => <Badge tone={publicationStatusTone(row.original.status)} dot>{publicationStatusLabel(row.original.status)}</Badge>,
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
          <ContentRowActions
            id={row.original.id}
            editHref={`/admin/lugares/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "places")}
            itemLabel="este lugar"
          kind="places"
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
          canPublish: (item) => computePublicationPermissions(item, currentUser, "places").canPublish,
          canArchive: (item) => computePublicationPermissions(item, currentUser, "places").canArchive,
        }}
        kind="places"
        onDone={() => router.refresh()}
      />
      <DataTable
        columns={columns}
        data={places}
        searchPlaceholder="Buscar lugares…"
        emptyMessage="Ningún lugar coincide con la búsqueda."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
