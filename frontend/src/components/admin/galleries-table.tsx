"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { Gallery } from "@/lib/api/types";
import type { AdminContentPage, AdminUser } from "@/lib/api/admin-types";
import { EngagementCell, TitleCell } from "@/components/admin/content-cells";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

/** Columna → campo de orden del backend (AdminListQuery). */
const SORT_KEYS: Record<string, string> = { title: "title", status: "status", createdAt: "createdAt" };

export function GalleriesTable({ page, currentUser }: { page: AdminContentPage<Gallery>; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Gallery[]>([]);

  const columns = useMemo<ColumnDef<Gallery, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <TitleCell href={`/admin/galerias/${row.original.id}`} title={row.original.title} images={row.original.images} />
        ),
      },
      {
        id: "photos",
        header: "Fotos",
        accessorFn: (row) => row.images.length,
        cell: ({ row }) => <span className="text-muted">{row.original.images.length}</span>,
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
            editHref={`/admin/galerias/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "galleries")}
            itemLabel="esta galería"
          kind="galleries"
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
          canPublish: (item) => computePublicationPermissions(item, currentUser, "galleries").canPublish,
          canArchive: (item) => computePublicationPermissions(item, currentUser, "galleries").canArchive,
        }}
        kind="galleries"
        onDone={() => router.refresh()}
      />
      <DataTable
        columns={columns}
        data={page.items}
        serverPage={page}
        sortKeys={SORT_KEYS}
        searchPlaceholder="Buscar galerías…"
        emptyMessage="Ninguna galería coincide con la búsqueda."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
