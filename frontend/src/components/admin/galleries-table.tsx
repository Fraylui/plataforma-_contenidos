"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ImageSquare, Images } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import type { Gallery } from "@/lib/api/types";
import type { AdminContentPage, AdminUser, EngagementCounts } from "@/lib/api/admin-types";
import { coverUrl, EngagementCell, TitleCell } from "@/components/admin/content-cells";
import { computePublicationPermissions, type PublicationPermissions } from "@/lib/admin/publication";
import { publicationStatusLabel, publicationStatusTone, formatPublishedDate } from "@/lib/content-labels";
import { DataTable } from "@/components/admin/ui";
import type { GridSelection } from "@/components/admin/ui/data-table";
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
        grid={{
          defaultView: "grid",
          renderItem: (gallery, selection) => (
            <GalleryCard
              gallery={gallery}
              selection={selection}
              engagement={page.engagement[gallery.id]}
              permissions={computePublicationPermissions(gallery, currentUser, "galleries")}
            />
          ),
        }}
      />
    </div>
  );
}

/**
 * Tarjeta de la cuadrícula: la portada manda (como el administrador de
 * fotos del celular), con la cantidad de fotos, el estado, las visitas y
 * «me gusta», y el mismo menú de acciones que la lista.
 */
function GalleryCard({
  gallery,
  selection,
  engagement,
  permissions,
}: {
  gallery: Gallery;
  selection: GridSelection;
  engagement: EngagementCounts | undefined;
  permissions: PublicationPermissions;
}) {
  const cover = coverUrl(gallery.images);
  const editHref = `/admin/galerias/${gallery.id}`;
  return (
    <article
      aria-label={gallery.title}
      className={`group relative overflow-hidden rounded-card bg-surface shadow-card transition-shadow ${
        selection.selected ? "ring-[3px] ring-accent" : ""
      }`}
    >
      <Link href={editHref} tabIndex={-1} aria-hidden="true" className="block aspect-square overflow-hidden bg-field">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura del backend o enlace externo, igual que TitleCell
          <img src={cover} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <span className="flex size-full items-center justify-center text-muted">
            <ImageSquare className="size-10" aria-hidden="true" />
          </span>
        )}
      </Link>
      {selection.selectable && (
        <label className="absolute top-1 left-1 flex size-11 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            aria-label={`Seleccionar ${gallery.title}`}
            checked={selection.selected}
            onChange={selection.toggle}
            className="size-5 cursor-pointer rounded accent-[var(--accent-fill)] shadow"
          />
        </label>
      )}
      <span className="pointer-events-none absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
        <Images className="size-3.5" aria-hidden="true" />
        {gallery.images.length}
        <span className="sr-only"> {gallery.images.length === 1 ? "foto" : "fotos"}</span>
      </span>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-1">
          <Link href={editHref} className="line-clamp-2 min-w-0 text-sm font-semibold text-foreground hover:text-accent hover:underline">
            {gallery.title}
          </Link>
          <ContentRowActions id={gallery.id} editHref={editHref} permissions={permissions} itemLabel="esta galería" kind="galleries" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge tone={publicationStatusTone(gallery.status)} dot>
            {publicationStatusLabel(gallery.status)}
          </Badge>
          <EngagementCell counts={engagement} />
        </div>
      </div>
    </article>
  );
}
