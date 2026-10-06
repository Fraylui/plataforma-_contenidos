"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Buildings,
  CalendarBlank,
  CircleNotch,
  ImagesSquare,
  MagnifyingGlass,
  MapPin,
  Notepad,
  X,
  type Icon,
} from "@phosphor-icons/react";
import type { SearchResult, SearchResultType } from "@/lib/api/types";
import { searchResultHref, searchResultTypeLabel } from "@/lib/content-labels";
import { imageUrl } from "@/lib/image-url";
import { isSearchShortcut } from "@/lib/search-shortcut";
import { cn } from "@/lib/utils";
import { Highlighted } from "@/components/ui/highlighted";

const DEBOUNCE_MS = 250;

const TYPE_ICON: Record<SearchResultType, Icon> = {
  ARTICLE: Notepad,
  PLACE: MapPin,
  EVENT: CalendarBlank,
  GALLERY: ImagesSquare,
  BUSINESS: Buildings,
};

const noopSubscribe = () => () => {};
/** "⌘K" en Apple, "Ctrl K" en el resto; null en el servidor (la pista aparece tras hidratar). */
function useShortcutLabel(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘K" : "Ctrl K"),
    () => null,
  );
}

/**
 * Buscador con sugerencias en vivo (diseño 2026-10-06): campo tipo píldora
 * con lupa, botón para borrar y pista Ctrl K — sin el desplegable "Buscar
 * en", que se veía anticuado: filtrar por tipo se hace con chips en la
 * página de resultados. Mientras se escribe pide un adelanto
 * (/api/search-suggest, con espera de 250 ms) y lo muestra en un panel con
 * miniatura, título resaltado y tipo con ícono; navegable con flechas.
 * Enter sin sugerencia activa, o "Ver todos", llevan a /buscar.
 */
export function SearchBox({
  variant,
  categoryNames,
  onNavigate,
}: {
  /** "panel": dentro del panel lateral del riel — campo enfocado al abrir y sugerencias en línea, sin atajo propio. */
  variant: "desktop" | "mobile" | "panel";
  categoryNames: Record<string, string>;
  /** Avisa al contenedor (panel lateral) que se navegó, para cerrarse. */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const desktop = variant === "desktop";
  const panel = variant === "panel";
  const wide = desktop || panel;
  const shortcutLabel = useShortcutLabel();

  // Atajo global (§45.2-C). Solo la variante de escritorio: la móvil se
  // muestra bajo 640 px, donde no hay teclado físico, y así un solo listener
  // enfoca siempre el campo visible.
  useEffect(() => {
    if (!desktop) return;
    function onGlobalKeyDown(e: globalThis.KeyboardEvent) {
      // Campos explícitos: un spread de KeyboardEvent no copia ctrlKey & cía. (getters del prototipo).
      const { key, ctrlKey, metaKey, altKey, shiftKey, isComposing } = e;
      const target = e.target as HTMLElement | null;
      if (e.defaultPrevented || !isSearchShortcut({ key, ctrlKey, metaKey, altKey, shiftKey, isComposing, target })) return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    }
    document.addEventListener("keydown", onGlobalKeyDown);
    return () => document.removeEventListener("keydown", onGlobalKeyDown);
  }, [desktop]);

  useEffect(() => {
    const trimmed = query.trim();
    // Sin texto no se pide nada: el panel se oculta entero (ver showDropdown).
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search-suggest?q=${encodeURIComponent(trimmed)}&size=6`, { signal: controller.signal });
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
  }, [query]);

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
    router.push(`/buscar?q=${encodeURIComponent(q.trim())}`);
    onNavigate?.();
  }

  function selectResult(item: SearchResult) {
    setOpen(false);
    router.push(searchResultHref(item.contentType, item.slug));
    onNavigate?.();
  }

  function clear() {
    setQuery("");
    setResults([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      // En el panel, Esc lo cierra (lo maneja el diálogo).
      if (panel) return;
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
      if (activeIndex >= 0 && results[activeIndex]) selectResult(results[activeIndex]);
      else goToFullResults(query);
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className={cn("relative", panel ? "w-full" : desktop ? "hidden w-full sm:block" : "sm:hidden")}>
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
        <div
          className={cn(
            "group flex items-center rounded-full border border-transparent bg-canvas-strong transition-[background-color,border-color,box-shadow,width] duration-200",
            "focus-within:border-accent focus-within:bg-surface focus-within:ring-4 focus-within:ring-accent/15",
            wide ? "h-11 w-full" : "h-10 w-10 focus-within:w-[min(18rem,calc(100vw-8rem))]",
          )}
        >
          <MagnifyingGlass
            aria-hidden="true"
            className={cn("pointer-events-none h-5 w-5 shrink-0 text-muted", wide ? "ml-4" : "ml-2.5")}
          />
          <input
            id={`${listboxId}-input`}
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
            aria-keyshortcuts={desktop ? "Control+K Meta+K /" : undefined}
            autoComplete="off"
            enterKeyHint="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            autoFocus={panel}
            placeholder={wide ? "Buscar lugares, eventos, publicaciones…" : "Buscar…"}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground placeholder-muted outline-none focus-visible:outline-none! [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={clear}
              aria-label="Borrar búsqueda"
              className="mr-1.5 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-foreground"
            >
              <X className="h-4 w-4" weight="bold" aria-hidden="true" />
            </button>
          )}
          {desktop && shortcutLabel && !query && (
            <kbd
              aria-hidden="true"
              className="pointer-events-none mr-3 hidden shrink-0 rounded-md border border-border bg-surface px-1.5 py-0.5 font-sans text-[11px] font-medium text-muted lg:block group-focus-within:hidden"
            >
              {shortcutLabel}
            </kbd>
          )}
        </div>
      </form>

      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Sugerencias de búsqueda"
          className={cn(
            panel
              ? "mt-3 -mx-2 overflow-hidden"
              : "absolute top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl",
            !panel && (desktop ? "inset-x-0" : "right-0 w-[min(22rem,calc(100vw-2rem))]"),
          )}
        >
          {loading && results.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted">
              <CircleNotch className="h-4 w-4 animate-spin" aria-hidden="true" />
              Buscando…
            </div>
          ) : results.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted">Sin resultados para «{query.trim()}». Prueba con otras palabras.</p>
          ) : (
            <ul className={cn("py-1.5", !panel && "max-h-[26rem] overflow-y-auto")}>
              {results.map((item, index) => {
                const TypeIcon = TYPE_ICON[item.contentType];
                const category = item.categoryId ? categoryNames[item.categoryId] : null;
                return (
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
                        index === activeIndex ? "bg-canvas" : "hover:bg-canvas/70",
                      )}
                    >
                      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-canvas-strong text-muted">
                        {item.featuredImageId || item.featuredImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- miniatura chica, sin necesidad de next/image
                          <img
                            src={item.featuredImageId ? imageUrl(`/api/v1/images/${item.featuredImageId}/file`) : (item.featuredImageUrl ?? "")}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <TypeIcon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          <Highlighted text={item.title} query={query} />
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <TypeIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {searchResultTypeLabel(item.contentType)}
                          {category && <> · {category}</>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {results.length > 0 && (
            <button
              type="button"
              onClick={() => goToFullResults(query)}
              className="flex w-full cursor-pointer items-center justify-between border-t border-border px-4 py-3 text-left text-sm font-semibold text-accent hover:bg-canvas"
            >
              Ver todos los resultados{totalElements > 0 ? ` (${totalElements})` : ""}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
