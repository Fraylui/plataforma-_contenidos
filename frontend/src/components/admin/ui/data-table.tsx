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
import { CaretDown, CaretLeft, CaretRight, CaretUp, CaretUpDown, MagnifyingGlass } from "@phosphor-icons/react";
import { Button, TextInput } from "@/components/ui";

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  /**
   * Selección de filas (casilla en cada una + "seleccionar todo" en el
   * encabezado) — opcional, solo se activa si se pasan ambas props. Usado
   * por las 6 tablas de contenido para las acciones en lote (publicar/
   * archivar varios a la vez, ver content-bulk-actions.tsx).
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
  // Actions con eso, DataTable no sabe nada de tipos de contenido.
  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(table.getSelectedRowModel().rows.map((row) => row.original));
    // table es estable entre renders (mismo objeto de useReactTable); solo
    // rowSelection dispara un cambio real de selección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, onSelectionChange]);

  return (
    <div>
      <TextInput
        type="search"
        name="tableSearch"
        aria-label={searchPlaceholder}
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder={searchPlaceholder}
        leading={<MagnifyingGlass aria-hidden="true" />}
        className="max-w-xs sm:max-w-sm"
      />

      <div className="mt-4 overflow-x-auto rounded-card bg-surface shadow-card">
        <table className="w-full min-w-max text-left text-sm">
          <thead className="border-b border-field-border bg-field/50">
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

      {table.getPageCount() > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted">
          <span>
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} · {table.getFilteredRowModel().rows.length} resultados
          </span>
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} icon={<CaretLeft aria-hidden="true" />}>
              Anterior
            </Button>
            <Button size="sm" variant="secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Siguiente
              <CaretRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
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
