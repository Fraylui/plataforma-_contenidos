"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  /**
   * Selección de filas (casilla en cada una + "seleccionar todo" en el
   * encabezado) — opcional, solo se activa si se pasan ambas props. Usado
   * por las 6 tablas de contenido para las acciones en lote (publicar/
   * archivar varios a la vez, ver editorial-bulk-actions.tsx).
   */
  getRowId?: (row: TData) => string;
  onSelectionChange?: (selected: TData[]) => void;
}

/** Tabla interactiva genérica: orden por columna, búsqueda en vivo (todas las columnas), paginación, selección opcional. Reutilizable en cualquier listado admin. */
export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados.",
  getRowId,
  onSelectionChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const selectable = Boolean(getRowId && onSelectionChange);

  const effectiveColumns = useMemo<ColumnDef<TData, unknown>[]>(
    () => (selectable ? [selectionColumn<TData>(), ...columns] : columns),
    [columns, selectable],
  );

  const table = useReactTable({
    data,
    columns: effectiveColumns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    enableRowSelection: selectable,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  // Notifica al padre con los objetos completos (no solo los IDs) cada vez
  // que cambia la selección — el padre calcula permisos/arma las Server
  // Actions con eso, DataTable no sabe nada de contenido editorial.
  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(table.getSelectedRowModel().rows.map((row) => row.original));
    // table es estable entre renders (mismo objeto de useReactTable); solo
    // rowSelection dispara un cambio real de selección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, onSelectionChange]);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          name="tableSearch"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full max-w-xs rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder-muted outline-none transition-colors focus-visible:border-accent sm:max-w-sm"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <th key={header.id} className="px-4 py-3 font-medium text-muted">
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : sortDirection === "desc" ? (
                            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
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
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent-soft/40">
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

      {table.getPageCount() > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} · {table.getFilteredRowModel().rows.length} resultados
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 transition-colors hover:bg-accent-soft hover:text-accent",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 transition-colors hover:bg-accent-soft hover:text-accent",
                "disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Columna de casilla de selección, prependeada a `columns` solo cuando la tabla es seleccionable (ver DataTableProps). */
function selectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Seleccionar todas las filas visibles"
        checked={table.getIsAllPageRowsSelected()}
        ref={(el) => {
          if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
        }}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
        className="h-4 w-4 cursor-pointer rounded border-border accent-accent"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label="Seleccionar fila"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        className="h-4 w-4 cursor-pointer rounded border-border accent-accent"
      />
    ),
    enableSorting: false,
  };
}
