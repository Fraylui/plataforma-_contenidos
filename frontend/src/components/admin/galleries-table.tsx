"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { Gallery } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computeGalleryPermissions } from "@/lib/admin/gallery-permissions";
import { articleStatusLabel, articleStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { StatusPill, DataTable } from "@/components/admin/ui";
import { EditorialRowActions } from "@/components/admin/editorial-row-actions";
import {
  approveGalleryAction,
  archiveGalleryAction,
  publishGalleryAction,
  rejectGalleryAction,
  submitGalleryAction,
} from "@/app/admin/(protected)/galerias/actions";

export function GalleriesTable({ galleries, currentUser }: { galleries: Gallery[]; currentUser: AdminUser }) {
  const columns = useMemo<ColumnDef<Gallery, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <Link href={`/admin/galerias/${row.original.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      {
        id: "photos",
        header: "Fotos",
        accessorFn: (row) => row.imageIds.length,
        cell: ({ row }) => <span className="text-muted">{row.original.imageIds.length}</span>,
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
            editHref={`/admin/galerias/${row.original.id}`}
            permissions={computeGalleryPermissions(row.original, currentUser)}
            itemLabel="esta galería"
            actions={{
              submit: submitGalleryAction,
              approve: approveGalleryAction,
              reject: rejectGalleryAction,
              publish: publishGalleryAction,
              archive: archiveGalleryAction,
            }}
          />
        ),
      },
    ],
    [currentUser],
  );

  return <DataTable columns={columns} data={galleries} searchPlaceholder="Buscar galerías…" emptyMessage="Ninguna galería coincide con la búsqueda." />;
}
