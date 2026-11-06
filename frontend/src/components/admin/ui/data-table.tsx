"use client";

import { type ReactNode, useEffect, useMemo, useState, useTransition } from "react";
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
import { CaretDown, CaretLeft, CaretRight, CaretUp, CaretUpDown, ListBullets, MagnifyingGlass, SquaresFour } from "@phosphor-icons/react";
import { Button, TextInput } from "@/components/ui";
import { STATUS_FILTER_OPTIONS } from "@/lib/admin/list-params";
import type { Table } from "@tanstack/react-table";

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
  /**
   * Vista en cuadrícula opcional (Galerías: lo que importa son las fotos).
   * Se elige con «Lista / Cuadrícula» y queda en la URL (?vista); búsqueda,
   * estado, orden, página y selección en lote funcionan igual en ambas.
   */
  grid?: {
    renderItem: (item: TData, selection: GridSelection) => ReactNode;
    /** Vista cuando la URL no dice nada. */
    defaultView?: "grid" | "list";
  };
}

/** Casilla de selección de una tarjeta de la cuadrícula. */
export interface GridSelection {
  selectable: boolean;
  selected: boolean;
  toggle: () => void;
}

const VIEW_PARAM = "vista";

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
  grid,
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
  const urlView = searchParams.get(VIEW_PARAM);
  const view: "grid" | "list" = !grid ? "list" : urlView === "lista" ? "list" : urlView === "cuadricula" ? "grid" : (grid.defaultView ?? "list");
  const [search, setSearch] = useState(urlQ);

  function navigate(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // Cambiar búsqueda, filtro u orden vuelve a la primera página (cambiar de vista no).
    if (!("page" in patch) && !(VIEW_PARAM in patch)) params.delete("page");
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
    const withSorting = columns.map((column) => ({ ...column, enableSorting: columnId(column) in sortKeys }));
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
  const primaryColumnId = columnId(columns[0]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* La vista va junto al buscador: en el celular no ocupa una fila propia. */}
        <div className="flex items-center gap-2">
        <TextInput
          type="search"
          name="tableSearch"
          aria-label={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          leading={<MagnifyingGlass aria-hidden="true" />}
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        {grid && (
          <div role="group" aria-label="Vista" className="flex shrink-0 rounded-full bg-field p-0.5">
            {([
              { value: "list", label: "Lista", icon: ListBullets },
              { value: "grid", label: "Cuadrícula", icon: SquaresFour },
            ] as const).map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={view === option.value}
                aria-label={option.label}
                title={option.label}
                onClick={() => navigate({ [VIEW_PARAM]: option.value === "grid" ? "cuadricula" : "lista" })}
                className={`flex size-9 items-center justify-center rounded-full transition-colors ${
                  view === option.value ? "bg-surface text-foreground shadow-card" : "text-muted hover:text-foreground"
                }`}
              >
                <option.icon className="size-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        </div>
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

      {view === "grid" && grid ? (
        <GridView
          table={table}
          renderItem={grid.renderItem}
          selectable={selectable}
          emptyMessage={emptyMessage}
          isPending={isPending}
          sortOptions={columnsSortOptions(columns, sortKeys)}
          sort={urlSort}
          onSort={(value) => navigate({ sort: value || undefined })}
        />
      ) : (
      <div
        className={`mt-4 overflow-x-auto rounded-card bg-surface shadow-card transition-opacity ${isPending ? "opacity-60" : ""}`}
        aria-busy={isPending}
      >
        {/* En el celular la tabla se vuelve una lista de tarjetas (sin scroll lateral): el orden pasa a un selector. */}
        <SortSelect options={columnsSortOptions(columns, sortKeys)} sort={urlSort} onSort={(value) => navigate({ sort: value || undefined })} className="flex justify-end border-b border-field-border p-3 md:hidden" />
        <table className="w-full text-left text-sm">
          <thead className="border-b border-field-border bg-field/50 max-md:hidden">
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
                <td colSpan={effectiveColumns.length} className="px-4 py-10 text-center text-muted max-md:block">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-field-border transition-colors last:border-0 hover:bg-field/60 max-md:relative max-md:flex max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-1.5 max-md:py-3 max-md:pr-24 ${
                    selectable ? "max-md:pl-14" : "max-md:pl-4"
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`px-4 py-3 align-middle text-foreground max-md:p-0 ${CELL_CLASS[cellRole(cell.column.id, primaryColumnId)]}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

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

function columnId<TData>(column: ColumnDef<TData, unknown> | undefined): string {
  if (!column) return "";
  return column.id ?? ("accessorKey" in column ? String(column.accessorKey) : "");
}

type CellRole = "select" | "primary" | "actions" | "meta";

/**
 * Papel de cada celda en la tarjeta del celular: la casilla a la izquierda,
 * la primera columna (el título) en su propia línea, las acciones («actions»)
 * arriba a la derecha y el resto como datos pequeños que se acomodan debajo.
 */
function cellRole(id: string, primaryColumnId: string): CellRole {
  if (id === "select") return "select";
  if (id === "actions") return "actions";
  return id === primaryColumnId ? "primary" : "meta";
}

const CELL_CLASS: Record<CellRole, string> = {
  select: "w-11 max-md:absolute max-md:left-4 max-md:top-5",
  primary: "min-w-56 max-md:basis-full",
  actions: "w-px whitespace-nowrap max-md:absolute max-md:right-2 max-md:top-3",
  meta: "whitespace-nowrap max-md:text-xs",
};

/** Opciones de orden para la cuadrícula (que no tiene encabezados): las columnas ordenables, en ambos sentidos. */
function columnsSortOptions<TData>(columns: ColumnDef<TData, unknown>[], sortKeys: Record<string, string>) {
  return columns.flatMap((column) => {
    const key = sortKeys[columnId(column)];
    if (!key || typeof column.header !== "string") return [];
    return [
      { value: `${key},desc`, label: `${column.header} (descendente)` },
      { value: `${key},asc`, label: `${column.header} (ascendente)` },
    ];
  });
}

function GridView<TData>({
  table,
  renderItem,
  selectable,
  emptyMessage,
  isPending,
  sortOptions,
  sort,
  onSort,
}: {
  table: Table<TData>;
  renderItem: (item: TData, selection: GridSelection) => ReactNode;
  selectable: boolean;
  emptyMessage: string;
  isPending: boolean;
  sortOptions: { value: string; label: string }[];
  sort: string;
  onSort: (value: string) => void;
}) {
  const rows = table.getRowModel().rows;
  return (
    <div className={`mt-4 transition-opacity ${isPending ? "opacity-60" : ""}`} aria-busy={isPending}>
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        {selectable && rows.length > 0 ? (
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-muted">
            <input
              type="checkbox"
              aria-label="Seleccionar todas las de esta página"
              checked={table.getIsAllPageRowsSelected()}
              ref={(el) => {
                if (el) el.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
              }}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
              className="size-4 cursor-pointer accent-[var(--accent-fill)]"
            />
            Seleccionar todas
          </label>
        ) : (
          <span />
        )}
        <SortSelect options={sortOptions} sort={sort} onSort={onSort} />
      </div>
      {rows.length === 0 ? (
        <p className="rounded-card bg-surface px-4 py-10 text-center text-sm text-muted shadow-card">{emptyMessage}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {rows.map((row) => (
            <li key={row.id}>
              {renderItem(row.original, {
                selectable,
                selected: row.getIsSelected(),
                toggle: () => row.toggleSelected(),
              })}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Orden sin encabezados (cuadrícula y lista del celular): las columnas ordenables, en ambos sentidos. */
function SortSelect({
  options,
  sort,
  onSort,
  className,
}: {
  options: { value: string; label: string }[];
  sort: string;
  onSort: (value: string) => void;
  className?: string;
}) {
  if (options.length === 0) return null;
  return (
    <div className={className}>
      <label className="inline-flex items-center gap-2 text-sm text-muted">
        <span className="sr-only sm:not-sr-only">Ordenar</span>
        <select
          value={options.some((option) => option.value === sort) ? sort : ""}
          onChange={(e) => onSort(e.target.value)}
          className="h-9 rounded-control border border-field-border bg-field px-3 text-sm text-foreground"
        >
          <option value="">Más recientes</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
