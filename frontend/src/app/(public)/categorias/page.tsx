import type { Metadata } from "next";
import Link from "next/link";
import { listActiveCategories } from "@/lib/api/client";

export const metadata: Metadata = {
  title: "Categorías",
  description: "Explorá el contenido por categoría — CONTEXTO.md sección 4.",
};

export default async function CategoriesPage() {
  const categories = await listActiveCategories();
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Categorías</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Artículos y lugares organizados por tema.
        </p>
      </header>

      <section className="mt-10" aria-label="Categorías">
        {sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Todavía no hay categorías activas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((category) => (
              <Link
                key={category.id}
                href={`/categorias/${category.slug}`}
                className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent hover:shadow-md focus-visible:border-accent"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
                    <path d="M2 4.5A1.5 1.5 0 0 1 3.5 3h4.379a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 11.12 5H16.5A1.5 1.5 0 0 1 18 6.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 15.5v-11Z" />
                  </svg>
                </span>
                <h2 className="text-lg font-semibold text-foreground transition-colors group-hover:text-accent">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-sm leading-relaxed text-muted line-clamp-2">{category.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
