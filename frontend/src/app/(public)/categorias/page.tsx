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
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Categorías</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">Explora todo el contenido del sitio por tema.</p>
      </header>

      <section className="mt-10" aria-label="Categorías">
        {sorted.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            Todavía no hay categorías activas.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((category) => (
              <Link
                key={category.id}
                href={`/categorias/${category.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl focus-visible:-translate-y-1 focus-visible:border-accent focus-visible:shadow-xl focus-visible:outline-none"
              >
                <span className="absolute inset-x-0 top-0 h-1 bg-accent opacity-70 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                <span className="block text-base font-semibold text-foreground transition-colors group-hover:text-accent">
                  {category.name}
                </span>
                {category.description && <p className="mt-1.5 text-sm text-muted">{category.description}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
