import { listPublishedArticles } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { platformPlaceholder } from "@/lib/platform-placeholder";

export default async function Home() {
  const page = await listPublishedArticles({ size: 24 });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {platformPlaceholder.name}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          {platformPlaceholder.description}
        </p>
      </header>

      <section className="mt-10" aria-label="Últimos artículos">
        {page.items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {page.items.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <p className="text-sm text-muted">
        Todavía no hay artículos publicados. Vuelve pronto.
      </p>
    </div>
  );
}
