"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import type { SearchResult, SearchResultType } from "@/lib/api/types";
import { searchResultHref } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";
import { Highlighted } from "@/components/ui/highlighted";

const DEBOUNCE_MS = 250;

/**
 * Buscador del header con sugerencias en vivo (mismo input para desktop y
 * mobile, variando solo el tamaño): mientras se escribe, pide un adelanto
 * de resultados (debounced, /api/search-suggest) y los muestra en un panel
 * flotante con navegación por teclado — antes el buscador solo enviaba a
 * /buscar sin ningún adelanto, un vacío frente a cualquier buscador de sitio
 * "profesional" actual. Enter sin sugerencia activa, o el enlace final del
 * panel, llevan a la página de resultados completa (con filtros por tipo,
 * paginación) — esto es un atajo, no un reemplazo de esa página.
 */
export interface SearchScope {
  value: SearchResultType | "";
  label: string;
}

/**
 * `scopes` (solo escritorio): selector "Buscar en" pegado al campo, como el
 * de departamentos de Amazon — acota sugerencias y resultados a un módulo
 * sin tener que ir primero a /buscar a filtrar. La primera opción es "Todo".
 */
export function SearchBox({
  variant,
  categoryNames,
  scopes = [],
}: {
  variant: "desktop" | "mobile";
  categoryNames: Record<string, string>;
  scopes?: SearchScope[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchResultType | "">("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  useEffect(() => {
    const trimmed = query.trim();
    // Sin query no hay nada que pedir — no hace falta limpiar resultados acá:
    // el dropdown ya se oculta por completo cuando `query` está vacío
    // (ver showDropdown), así que un resultado viejo en memoria no se llega
    // a mostrar nunca.
    if (!trimmed) {
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const scopeParam = scope ? `&type=${scope}` : "";
        const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(trimmed)}&size=6${scopeParam}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("search-suggest failed");
        const data: { items: SearchResult[]; totalElements?: number } = await res.json();
        setResults(data.items);
        setTotalElements(data.totalElements ?? data.items.length);
        setActiveIndex(-1);
      } catch {
        // abortado (nueva letra) o falló la red: sin adelanto, /buscar sigue funcionando igual
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function goToFullResults(q: string) {
    if (!q.trim()) return;
    setOpen(false);
    inputRef.current?.blur();
    router.push(`/buscar?q=${encodeURIComponent(q.trim())}${scope ? `&type=${scope}` : ""}`);
  }

  function selectResult(item: SearchResult) {
    setOpen(false);
    router.push(searchResultHref(item.contentType, item.slug));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) {
      if (e.key === "Enter") goToFullResults(query);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        selectResult(results[activeIndex]);
      } else {
        goToFullResults(query);
      }
    }
  }

  const showDropdown = open && query.trim().length > 0;
  const desktop = variant === "desktop";

  return (
    <div ref={containerRef} className={cn("relative", desktop ? "hidden w-full sm:block" : "sm:hidden")}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToFullResults(query);
        }}
      >
        <label htmlFor={`${listboxId}-input`} className="sr-only">
          Buscar contenido
        </label>
        {desktop ? (
          <div className="flex h-11 w-full items-stretch overflow-hidden rounded-full border border-border bg-background shadow-[0_1px_2px_rgb(0_0_0_/_0.04)] transition-[border-color,box-shadow] focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
            {scopes.length > 1 && (
              <>
                <label htmlFor={`${listboxId}-scope`} className="sr-only">
                  Buscar en
                </label>
                <select
                  id={`${listboxId}-scope`}
                  value={scope}
                  onChange={(e) => setScope(e.target.value as SearchResultType | "")}
                  className="max-w-36 shrink-0 cursor-pointer border-r border-border bg-canvas pr-2 pl-4 text-[13px] font-medium text-foreground outline-none hover:bg-canvas-strong focus-visible:bg-accent-soft"
                >
                  {scopes.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
          <input
            id={`${listboxId}-input`}
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Busca publicaciones, lugares, eventos…"
            className="min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground placeholder-muted outline-none [&::-webkit-search-cancel-button]:hidden"
          />
            <button
              type="submit"
              aria-label="Buscar"
              className="m-1 flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent px-4 text-accent-foreground transition-opacity hover:opacity-90"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <input
              id={`${listboxId}-input`}
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={showDropdown}
              aria-controls={listboxId}
              aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
              autoComplete="off"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Buscar…"
              className="peer h-11 w-11 rounded-md border border-transparent bg-transparent py-2 pr-3 pl-11 text-sm text-foreground outline-none transition-[width,background-color,border-color,color] duration-200 focus:w-64 focus:border-border focus:bg-background focus:pl-9 focus:text-foreground"
            />
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-muted transition-[left,transform,color] duration-200 peer-focus:left-3 peer-focus:translate-x-0 peer-focus:text-foreground"
            />
          </>
        )}
      </form>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sugerencias de búsqueda"
          className={cn(
            "absolute top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lg",
            desktop ? "inset-x-0" : "right-0 w-80 max-w-[90vw]",
          )}
        >
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Buscando…
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">
              Sin resultados rápidos para «{query.trim()}» — probá otras palabras o revisá todo el contenido.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {results.map((item, index) => (
                <li key={`${item.contentType}-${item.id}`} role="presentation">
                  <button
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectResult(item)}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition-colors",
                      index === activeIndex ? "bg-accent-soft" : "hover:bg-accent-soft/60",
                    )}
                  >
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-canvas-strong">
                      {item.featuredImageId || item.featuredImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- miniatura chica, sin necesidad de next/image
                        <img
                          src={item.featuredImageId ? imageUrl(`/api/v1/images/${item.featuredImageId}/file`) : (item.featuredImageUrl ?? "")}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        <Highlighted text={item.title} query={query} />
                      </span>
                      {item.categoryId && categoryNames[item.categoryId] && (
                        <span className="text-xs text-muted">{categoryNames[item.categoryId]}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim() && (totalElements > results.length || results.length > 0) && (
            <button
              type="button"
              onClick={() => goToFullResults(query)}
              className="block w-full cursor-pointer border-t border-border px-4 py-2.5 text-left text-sm font-medium text-accent hover:bg-accent-soft"
            >
              Ver todos los resultados{totalElements > 0 ? ` (${totalElements})` : ""} para «{query.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}
