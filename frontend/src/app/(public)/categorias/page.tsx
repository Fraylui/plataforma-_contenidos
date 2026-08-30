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
          <div className="flex flex-wrap gap-2.5">
            {sorted.map((category) => (
              <Link
                key={category.id}
                href={`/categorias/${category.slug}`}
                title={category.description ?? undefined}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent focus-visible:border-accent"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
