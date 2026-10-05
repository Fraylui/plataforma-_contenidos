import Link from "next/link";
import { getFeed } from "@/lib/api/client";
import type { Category } from "@/lib/api/types";
import { fromFeedItem } from "@/lib/home-items";
import { ContentCard } from "@/components/home/content-card";

const RECENT_SIZE = 6;
const MAX_TOPICS = 6;

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Temas cuyo nombre se parece a alguna palabra buscada: contiene la palabra
 * o comparte sus primeras 4 letras ("turistico" -> Turismo, "gastro" ->
 * Gastronomía). Es más laxo que la búsqueda del backend a propósito: acá
 * solo sugiere a dónde ir, no afirma que haya resultados.
 */
function matchingTopics(query: string, categories: Category[]): Category[] {
  const words = normalize(query)
    .split(/\s+/)
    .filter((word) => word.length >= 3);
  if (words.length === 0) return [];
  return categories
    .filter((category) => {
      const name = normalize(category.name);
      return words.some((word) => name.includes(word) || (word.length >= 4 && name.split(/\s+/).some((part) => part.startsWith(word.slice(0, 4)))));
    })
    .slice(0, MAX_TOPICS);
}

/**
 * Una búsqueda nunca termina en una página vacía (como Amazon y MSN): con
 * pocos o ningún resultado se sugieren temas parecidos y lo más reciente,
 * sin repetir lo que ya salió en los resultados.
 */
export async function SearchSuggestions({
  query,
  categories,
  categoryNames,
  excludeIds,
  hasResults,
}: {
  query: string;
  categories: Category[];
  categoryNames: Record<string, string>;
  excludeIds: string[];
  hasResults: boolean;
}) {
  const topics = matchingTopics(query, categories);
  const hourSeed = new Date().toISOString().slice(0, 13);
  const recentPage = await getFeed({ size: RECENT_SIZE, exclude: excludeIds, seed: hourSeed }).catch(() => null);
  const recent = (recentPage?.items ?? []).map(fromFeedItem);

  if (topics.length === 0 && recent.length === 0) return null;

  return (
    <div className={hasResults ? "mt-14 border-t border-foreground/[0.06] pt-10" : "mt-8"}>
      {topics.length > 0 && (
        <section aria-labelledby="temas-sugeridos">
          <h2 id="temas-sugeridos" className="text-sm font-bold tracking-tight text-foreground">
            {hasResults ? "Explora el tema completo" : "¿Buscabas alguno de estos temas?"}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/categorias/${topic.slug}`}
                  className="inline-flex min-h-10 items-center rounded-full border border-foreground/[0.08] bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                >
                  {topic.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section aria-labelledby="lo-mas-reciente" className={topics.length > 0 ? "mt-10" : undefined}>
          <h2 id="lo-mas-reciente" className="text-sm font-bold tracking-tight text-foreground">
            {hasResults ? "También te puede interesar" : "Mientras tanto, lo más reciente"}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {recent.map((item) => (
              <ContentCard key={item.id} item={item} categoryName={categoryNames[item.categoryId]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
