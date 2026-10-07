"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Business } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, businessTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

export function BusinessesTable({ businesses, currentUser }: { businesses: Business[]; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Business[]>([]);

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
            editHref={`/admin/directorio/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "directory")}
            itemLabel="esta ficha"
          kind="directory"
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
          canPublish: (item) => computePublicationPermissions(item, currentUser, "directory").canPublish,
          canArchive: (item) => computePublicationPermissions(item, currentUser, "directory").canArchive,
        }}
        kind="directory"
        onDone={() => router.refresh()}
      />
      <DataTable
        columns={columns}
        data={businesses}
        searchPlaceholder="Buscar en el directorio…"
        emptyMessage="Ninguna ficha coincide con la búsqueda."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
