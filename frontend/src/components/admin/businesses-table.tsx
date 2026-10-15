"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { Business } from "@/lib/api/types";
import type { AdminContentPage, AdminUser } from "@/lib/api/admin-types";
import { EngagementCell, TitleCell } from "@/components/admin/content-cells";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, businessTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

/** Columna → campo de orden del backend (AdminListQuery). */
const SORT_KEYS: Record<string, string> = { name: "title", status: "status", createdAt: "createdAt" };

export function BusinessesTable({ page, currentUser }: { page: AdminContentPage<Business>; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Business[]>([]);

  const columns = useMemo<ColumnDef<Business, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <TitleCell href={`/admin/directorio/${row.original.id}`} title={row.original.name} images={row.original.images} />
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
            editHref={`/admin/directorio/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "directory")}
            itemLabel="esta ficha"
          kind="directory"
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
          canPublish: (item) => computePublicationPermissions(item, currentUser, "directory").canPublish,
          canArchive: (item) => computePublicationPermissions(item, currentUser, "directory").canArchive,
        }}
        kind="directory"
        onDone={() => router.refresh()}
      />
      <DataTable
        columns={columns}
        data={page.items}
        serverPage={page}
        sortKeys={SORT_KEYS}
        searchPlaceholder="Buscar en el directorio…"
        emptyMessage="Ninguna ficha coincide con la búsqueda."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
