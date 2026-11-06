"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { Celebration } from "@/lib/api/types";
import type { AdminContentPage, AdminUser } from "@/lib/api/admin-types";
import { EngagementCell, TitleCell } from "@/components/admin/content-cells";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone } from "@/lib/content-labels";
import { formatCelebrationDate } from "@/lib/celebration-date";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

/** Columna → campo de orden del backend (AdminListQuery). */
const SORT_KEYS: Record<string, string> = { title: "title", status: "status", nextOccurrenceAt: "nextOccurrence" };

export function CelebrationsTable({ page, currentUser }: { page: AdminContentPage<Celebration>; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Celebration[]>([]);

  const columns = useMemo<ColumnDef<Celebration, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <TitleCell href={`/admin/celebraciones/${row.original.id}`} title={row.original.title} images={row.original.images} />
        ),
      },
      {
        // La próxima vez que toca (no el año de origen: «desde 1824» va en la celebración).
        accessorKey: "nextOccurrenceAt",
        header: "Próxima fecha",
        cell: ({ row }) => (
          <span className="text-muted">
            {formatCelebrationDate({
              at: row.original.nextOccurrenceAt,
              allDay: row.original.allDay,
              recursYearly: row.original.recursYearly,
              sinceYear: row.original.sinceYear,
            })}
          </span>
        ),
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
            editHref={`/admin/celebraciones/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "celebrations")}
            itemLabel="esta celebración"
          kind="celebrations"
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
          canPublish: (item) => computePublicationPermissions(item, currentUser, "celebrations").canPublish,
          canArchive: (item) => computePublicationPermissions(item, currentUser, "celebrations").canArchive,
        }}
        kind="celebrations"
        onDone={() => router.refresh()}
      />
      <DataTable
        columns={columns}
        data={page.items}
        serverPage={page}
        sortKeys={SORT_KEYS}
        searchPlaceholder="Buscar celebraciones…"
        emptyMessage="Ninguna celebración coincide con la búsqueda."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
