import type { Metadata } from "next";
import { listActiveCategories, listPublishedBusinesses } from "@/lib/api/client";
import { BusinessCard } from "@/components/directory/business-card";
import { Pagination } from "@/components/ui/pagination";
import { AdBlock } from "@/components/legal/ad-block";
import { FilterMenu } from "@/components/filters/filter-menu";
import { ListingHeader } from "@/components/layout/listing-header";
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
  const categoryNames: Record<string, string> = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ListingHeader
        title="Directorio"
        description="Restaurantes, hoteles y servicios locales."
        count={`${result.totalElements.toLocaleString("es")} ${result.totalElements === 1 ? "negocio" : "negocios"}`}
      >
        <FilterMenu
          label="Tipo de negocio"
          allLabel="Todos los tipos"
          options={BUSINESS_TYPES.map((t) => ({ value: t, label: businessTypeLabel(t) }))}
          activeValue={businessType}
          paramName="businessType"
          basePath={BASE_PATH}
          extraParams={categoryId ? { categoryId } : undefined}
        />
        <FilterMenu
          label="Filtrar por tema"
          allLabel="Todas las categorías"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          activeValue={categoryId}
          paramName="categoryId"
          basePath={BASE_PATH}
          extraParams={businessType ? { businessType } : undefined}
        />
      </ListingHeader>

      <AdBlock position="cabecera" className="mt-8 hidden md:block" />

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
              {result.items.map((business, index) => (
                <BusinessCard
                  key={business.id}
                  business={business}
                  categoryName={categoryNames[business.categoryId]}
                  featured={page === 0 && index === 0}
                />
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

      <AdBlock position="listing" className="mt-10" />
    </div>
  );
}
