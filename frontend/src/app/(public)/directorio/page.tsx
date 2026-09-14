import type { Metadata } from "next";
import Link from "next/link";
import { listActiveCategories, listPublishedBusinesses } from "@/lib/api/client";
import { BusinessCard } from "@/components/directory/business-card";
import { Pagination } from "@/components/ui/pagination";
import { AdBlock } from "@/components/legal/ad-block";
import { CategoryChips } from "@/components/filters/category-chips";
import { businessTypeLabel } from "@/lib/content-labels";
import type { BusinessType } from "@/lib/api/types";

const PAGE_SIZE = 24;
const BASE_PATH = "/directorio";
const BUSINESS_TYPES: BusinessType[] = ["RESTAURANT", "HOTEL", "SERVICE", "SHOP", "OTHER"];

export const metadata: Metadata = {
  title: "Directorio",
  description: "Restaurantes, hoteles y servicios locales.",
  // Sin esto hereda el canonical "/" del layout raíz (bug real hallado con
  // Lighthouse/lhci: SEO le decía a los buscadores que esta página era
  // duplicado del home).
  alternates: { canonical: BASE_PATH },
};

function buildHref(businessType: BusinessType | null, categoryId: string | null, page: number): string {
  const params = new URLSearchParams();
  if (businessType) params.set("businessType", businessType);
  if (categoryId) params.set("categoryId", categoryId);
  if (page > 0) params.set("page", String(page));
  const query = params.toString();
  return query ? `${BASE_PATH}?${query}` : BASE_PATH;
}

export default async function DirectoryPage(props: PageProps<"/directorio">) {
  const {
    page: pageParam,
    businessType: businessTypeParam,
    categoryId: categoryIdParam,
  } = await props.searchParams;
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;
  const businessType = BUSINESS_TYPES.includes(businessTypeParam as BusinessType)
    ? (businessTypeParam as BusinessType)
    : null;
  const categoryId = typeof categoryIdParam === "string" ? categoryIdParam : null;

  const [result, categories] = await Promise.all([
    listPublishedBusinesses({
      page,
      size: PAGE_SIZE,
      businessType: businessType ?? undefined,
      categoryId: categoryId ?? undefined,
    }),
    listActiveCategories(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Directorio</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Restaurantes, hoteles y servicios locales.
        </p>
      </header>

      <nav aria-label="Filtrar por tipo" className="mt-6 flex flex-wrap gap-2">
        <Link
          href={buildHref(null, categoryId, 0)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            businessType === null ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
          }`}
        >
          Todo
        </Link>
        {BUSINESS_TYPES.map((type) => (
          <Link
            key={type}
            href={buildHref(type, categoryId, 0)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              businessType === type ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {businessTypeLabel(type)}
          </Link>
        ))}
      </nav>

      <div className="mt-4">
        <CategoryChips
          categories={categories}
          activeCategoryId={categoryId}
          buildHref={(catId) => buildHref(businessType, catId, 0)}
        />
      </div>

      <section className="mt-8" aria-label="Directorio">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {businessType || categoryId
              ? "Ninguna ficha de directorio coincide con este filtro."
              : "Todavía no hay fichas de directorio publicadas."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {result.items.map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={(p) => buildHref(businessType, categoryId, p)}
            />
          </>
        )}
      </section>

      <div className="mt-10">
        <AdBlock position="listing" />
      </div>
    </div>
  );
}
