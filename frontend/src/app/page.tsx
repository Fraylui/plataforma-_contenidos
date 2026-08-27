import Link from "next/link";
import { getPlatformSettings, listPublishedArticles, listPublishedPlaces } from "@/lib/api/client";
import { ArticleCard } from "@/components/article/article-card";
import { PlaceCard } from "@/components/place/place-card";

const FEATURED_PLACES_SIZE = 4;
const RECENT_ARTICLES_SIZE = 6;

export default async function Home() {
  const [articlesPage, placesPage, settings] = await Promise.all([
    listPublishedArticles({ size: RECENT_ARTICLES_SIZE }),
    listPublishedPlaces({ size: FEATURED_PLACES_SIZE }),
    getPlatformSettings(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
          {settings.name}
        </h1>
        {settings.description && (
          <p className="mt-3 text-base leading-relaxed text-muted">{settings.description}</p>
        )}
      </header>

      {placesPage.items.length > 0 && (
        <section className="mt-12" aria-label="Lugares destacados">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-medium text-foreground">Lugares destacados</h2>
            <Link href="/lugares" className="text-sm font-medium text-accent hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {placesPage.items.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12" aria-label="Artículos recientes">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-medium text-foreground">Artículos recientes</h2>
          {articlesPage.items.length > 0 && (
            <Link href="/articulos" className="text-sm font-medium text-accent hover:underline">
              Ver todos
            </Link>
          )}
        </div>
        {articlesPage.items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articlesPage.items.map((article) => (
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
    <div className="mt-4 rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <p className="text-sm text-muted">
        Todavía no hay artículos publicados. Vuelve pronto.
      </p>
    </div>
  );
}
