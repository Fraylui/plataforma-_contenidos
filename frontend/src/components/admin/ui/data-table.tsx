"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type Updater,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CaretDown, CaretLeft, CaretRight, CaretUp, CaretUpDown, MagnifyingGlass } from "@phosphor-icons/react";
import { Button, TextInput } from "@/components/ui";
import { STATUS_FILTER_OPTIONS } from "@/lib/admin/list-params";

/** Metadatos de la página que devolvió el backend (PageResponse). */
export interface ServerPage {
  page: number;
  totalPages: number;
  totalElements: number;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  /** Solo las filas de la página actual. */
  data: TData[];
  serverPage: ServerPage;
  /** id de columna → campo de orden del backend (AdminListQuery). Las columnas que no estén aquí no se ordenan. */
  sortKeys?: Record<string, string>;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /**
   * Selección de filas (casilla en cada una + "seleccionar todo" en el
   * encabezado) — opcional, solo se activa si se pasan ambas props. Usado
   * por las tablas de contenido para las acciones en lote (publicar/
   * archivar varios a la vez, ver content-bulk-actions.tsx).
   */
  getRowId?: (row: TData) => string;
  onSelectionChange?: (selected: TData[]) => void;
}

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Tabla de los listados del panel, paginada en el servidor (hoja de ruta F3):
 * búsqueda, estado, orden y página viven en la URL (?q&status&sort&page) y
 * los resuelve el backend — con miles de piezas el navegador solo recibe 20.
 * La URL se puede compartir y el botón atrás vuelve al filtro anterior.
 */
export function DataTable<TData>({
  columns,
  data,
  serverPage,
  sortKeys = {},
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados.",
  getRowId,
  onSelectionChange,
}: DataTableProps<TData>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectable = Boolean(getRowId && onSelectionChange);

  const urlQ = searchParams.get("q") ?? "";
  const urlStatus = searchParams.get("status") ?? "";
  const urlSort = searchParams.get("sort") ?? "";
  const [search, setSearch] = useState(urlQ);

  function navigate(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Cambiar búsqueda, filtro u orden vuelve a la primera página.
    if (!("page" in patch)) params.delete("page");
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }

  useEffect(() => {
    if (search.trim() === urlQ) return;
    const timer = setTimeout(() => navigate({ q: search.trim() || undefined }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // navigate cambia en cada render; solo importa el texto escrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, urlQ]);

  // Al cambiar de página o de filtro, la selección anterior ya no está a la vista.
  useEffect(() => setRowSelection({}), [searchParams]);

  const sorting = useMemo<SortingState>(() => {
    const [key, direction] = urlSort.split(",");
    const columnId = Object.keys(sortKeys).find((id) => sortKeys[id] === key);
    return columnId ? [{ id: columnId, desc: direction !== "asc" }] : [];
  }, [urlSort, sortKeys]);

  function onSortingChange(updater: Updater<SortingState>) {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const first = next[0];
    navigate({ sort: first ? `${sortKeys[first.id]},${first.desc ? "desc" : "asc"}` : undefined });
  }

  const effectiveColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    const withSorting = columns.map((column) => {
      const id = column.id ?? ("accessorKey" in column ? String(column.accessorKey) : "");
      return { ...column, enableSorting: id in sortKeys };
    });
    return selectable ? [selectionColumn<TData>(), ...withSorting] : withSorting;
  }, [columns, selectable, sortKeys]);

  const table = useReactTable({
    data,
    columns: effectiveColumns,
    state: { sorting, rowSelection },
    onSortingChange,
    onRowSelectionChange: setRowSelection,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    enableRowSelection: selectable,
    enableSortingRemoval: true,
    manualSorting: true,
    manualPagination: true,
    pageCount: serverPage.totalPages,
    getCoreRowModel: getCoreRowModel(),
  });

  // Notifica al padre con los objetos completos (no solo los IDs) cada vez
  // que cambia la selección — el padre calcula permisos/arma las Server
  // Actions con eso, DataTable no sabe nada de tipos de contenido.
  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(table.getSelectedRowModel().rows.map((row) => row.original));
    // table es estable entre renders (mismo objeto de useReactTable); solo
    // rowSelection dispara un cambio real de selección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, onSelectionChange]);

  const currentPage = serverPage.page + 1;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <TextInput
          type="search"
          name="tableSearch"
          aria-label={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          leading={<MagnifyingGlass aria-hidden="true" />}
          className="max-w-xs sm:max-w-sm"
        />
        <div role="group" aria-label="Filtrar por estado" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:pb-0">
          {[{ value: "", label: "Todos" }, ...STATUS_FILTER_OPTIONS].map((option) => {
            const active = urlStatus === option.value;
            return (
              <button
                key={option.value || "all"}
                type="button"
                aria-pressed={active}
                onClick={() => navigate({ status: option.value || undefined })}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-accent-fill text-accent-foreground" : "bg-field text-muted hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className={`mt-4 overflow-x-auto rounded-card bg-surface shadow-card transition-opacity ${isPending ? "opacity-60" : ""}`}
        aria-busy={isPending}
      >
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-field-border bg-field/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="px-4 py-3 font-medium text-muted"
                      aria-sort={sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : undefined}
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection === "asc" ? (
                            <CaretUp weight="bold" className="size-3.5" aria-hidden="true" />
                          ) : sortDirection === "desc" ? (
                            <CaretDown weight="bold" className="size-3.5" aria-hidden="true" />
                          ) : (
                            <CaretUpDown className="size-3.5 opacity-40" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={effectiveColumns.length} className="px-4 py-10 text-center text-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-field-border transition-colors last:border-0 hover:bg-field/60">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-middle text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <span>
          {serverPage.totalElements} {serverPage.totalElements === 1 ? "resultado" : "resultados"}
          {serverPage.totalPages > 1 && ` · página ${currentPage} de ${serverPage.totalPages}`}
        </span>
        {serverPage.totalPages > 1 && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate({ page: currentPage - 1 > 1 ? String(currentPage - 1) : undefined })}
              disabled={currentPage <= 1 || isPending}
              icon={<CaretLeft aria-hidden="true" />}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate({ page: String(currentPage + 1) })}
              disabled={currentPage >= serverPage.totalPages || isPending}
            >
              Siguiente
              <CaretRight aria-hidden="true" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Casilla visual de 16px, pero el área de click real es 44x44 (mínimo WCAG
// touch target) vía el <label> que la envuelve con margen negativo — antes
// era clickeable solo dentro del cuadradito de 16px, difícil de tocar con
// precisión en tablet (mismo criterio que los puntos del carrusel del home).
const CHECKBOX_HIT_AREA = "-m-3.5 flex h-11 w-11 cursor-pointer items-center justify-center";

/** Columna de casilla de selección, prependeada a `columns` solo cuando la tabla es seleccionable (ver DataTableProps). */
function selectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <label className={CHECKBOX_HIT_AREA}>
        <input
          type="checkbox"
          aria-label="Seleccionar todas las filas visibles"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
          }}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="size-4 cursor-pointer accent-[var(--accent-fill)]"
        />
      </label>
    ),
    cell: ({ row }) => (
      <label className={CHECKBOX_HIT_AREA}>
        <input
          type="checkbox"
          aria-label="Seleccionar fila"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          className="size-4 cursor-pointer accent-[var(--accent-fill)] disabled:cursor-not-allowed"
        />
      </label>
    ),
    enableSorting: false,
  };
}
