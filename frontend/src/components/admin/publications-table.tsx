"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Article } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computeArticlePermissions } from "@/lib/admin/article-permissions";
import { articleStatusLabel, articleStatusTone, articleTypeLabel, formatPublishedDate } from "@/lib/content-labels";
import { StatusPill, DataTable } from "@/components/admin/ui";
import { EditorialRowActions } from "@/components/admin/editorial-row-actions";
import {
  approveArticleAction,
  archiveArticleAction,
  publishArticleAction,
  rejectArticleAction,
  submitArticleAction,
} from "@/app/admin/(protected)/publicaciones/actions";

export function PublicationsTable({ articles, currentUser }: { articles: Article[]; currentUser: AdminUser }) {
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
        cell: ({ row }) => <StatusPill tone={articleStatusTone(row.original.status)} label={articleStatusLabel(row.original.status)} />,
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
          <EditorialRowActions
            id={row.original.id}
            editHref={`/admin/publicaciones/${row.original.id}`}
            permissions={computeArticlePermissions(row.original, currentUser)}
            itemLabel="esta publicación"
            actions={{
              submit: submitArticleAction,
              approve: approveArticleAction,
              reject: rejectArticleAction,
              publish: publishArticleAction,
              archive: archiveArticleAction,
            }}
          />
        ),
      },
    ],
    [currentUser],
  );

  return (
    <DataTable
      columns={columns}
      data={articles}
      searchPlaceholder="Buscar publicaciones…"
      emptyMessage="Ninguna publicación coincide con la búsqueda."
    />
  );
}
