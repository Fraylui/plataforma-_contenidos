"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { Publication } from "@/lib/api/types";
import type { AdminContentPage, AdminUser } from "@/lib/api/admin-types";
import { EngagementCell, TitleCell } from "@/components/admin/content-cells";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, publicationTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

/** Columna → campo de orden del backend (AdminListQuery). */
const SORT_KEYS: Record<string, string> = { title: "title", status: "status", createdAt: "createdAt" };

export function PublicationsTable({ page, currentUser }: { page: AdminContentPage<Publication>; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Publication[]>([]);

  const columns = useMemo<ColumnDef<Publication, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <TitleCell href={`/admin/publicaciones/${row.original.id}`} title={row.original.title} images={row.original.images} />
        ),
      },
      {
        accessorKey: "publicationType",
        header: "Tipo",
        cell: ({ row }) => <span className="text-muted">{publicationTypeLabel(row.original.publicationType)}</span>,
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
            editHref={`/admin/publicaciones/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "publications")}
            itemLabel="esta publicación"
          kind="publications"
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
          canPublish: (item) => computePublicationPermissions(item, currentUser, "publications").canPublish,
          canArchive: (item) => computePublicationPermissions(item, currentUser, "publications").canArchive,
        }}
        kind="publications"
        onDone={() => router.refresh()}
      />
      <DataTable
        columns={columns}
        data={page.items}
        serverPage={page}
        sortKeys={SORT_KEYS}
        searchPlaceholder="Buscar publicaciones…"
        emptyMessage="Ninguna publicación coincide con la búsqueda o el filtro."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
