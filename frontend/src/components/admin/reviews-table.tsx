"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import type { Review } from "@/lib/api/types";
import type { AdminUser } from "@/lib/api/admin-types";
import { computeReviewPermissions } from "@/lib/admin/review-permissions";
import { articleStatusLabel, articleStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { StatusPill, DataTable } from "@/components/admin/ui";
import { EditorialRowActions } from "@/components/admin/editorial-row-actions";
import {
  approveReviewAction,
  archiveReviewAction,
  publishReviewAction,
  rejectReviewAction,
  submitReviewAction,
} from "@/app/admin/(protected)/resenas/actions";

export function ReviewsTable({ reviews, currentUser }: { reviews: Review[]; currentUser: AdminUser }) {
  const columns = useMemo<ColumnDef<Review, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Título",
        cell: ({ row }) => (
          <Link href={`/admin/resenas/${row.original.id}`} className="font-medium text-foreground hover:text-accent hover:underline">
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: "rating",
        header: "Calificación",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-muted">
            <Star className="h-3.5 w-3.5 fill-current text-accent" aria-hidden="true" />
            {row.original.rating} / 5
          </span>
        ),
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
            editHref={`/admin/resenas/${row.original.id}`}
            permissions={computeReviewPermissions(row.original, currentUser)}
            itemLabel="esta reseña"
            actions={{
              submit: submitReviewAction,
              approve: approveReviewAction,
              reject: rejectReviewAction,
              publish: publishReviewAction,
              archive: archiveReviewAction,
            }}
          />
        ),
      },
    ],
    [currentUser],
  );

  return <DataTable columns={columns} data={reviews} searchPlaceholder="Buscar reseñas…" emptyMessage="Ninguna reseña coincide con la búsqueda." />;
}
