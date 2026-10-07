"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Article } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computePublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, articleTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import { ContentRowActions } from "@/components/admin/content-row-actions";
import { ContentBulkActions } from "@/components/admin/content-bulk-actions";
import { Badge } from "@/components/ui";

export function PublicationsTable({ articles, currentUser }: { articles: Article[]; currentUser: AdminUser }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Article[]>([]);

  const columns = useMemo<ColumnDef<Article, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <Link href={`/admin/publicaciones/${row.original.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "articleType",
        header: "Tipo",
        cell: ({ row }) => <span className="text-muted">{articleTypeLabel(row.original.articleType)}</span>,
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
            editHref={`/admin/publicaciones/${row.original.id}`}
            permissions={computePublicationPermissions(row.original, currentUser, "articles")}
            itemLabel="esta publicación"
          kind="articles"
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
          canPublish: (item) => computePublicationPermissions(item, currentUser, "articles").canPublish,
          canArchive: (item) => computePublicationPermissions(item, currentUser, "articles").canArchive,
        }}
        kind="articles"
        onDone={() => router.refresh()}
      />
      <DataTable
        columns={columns}
        data={articles}
        searchPlaceholder="Buscar publicaciones…"
        emptyMessage="Ninguna publicación coincide con la búsqueda."
        getRowId={(row) => row.id}
        onSelectionChange={setSelected}
      />
    </div>
  );
}
