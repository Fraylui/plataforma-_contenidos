import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlaceRegions, listPublishedPlaces } from "@/lib/api/client";
import { fromPlaceSummary } from "@/lib/home-items";
import { regionFromSlug, regionName, regionSlug } from "@/lib/peru-regions";
import { SITE_URL } from "@/lib/site-url";
import { GridTile } from "@/components/post/grid-tile";

/** Tope de lugares por página de región (si una región pasa de esto, se agrega paginación). */
const MAX_PLACES = 60;

async function loadRegion(slug: string) {
  const region = regionFromSlug(slug);
  if (!region) notFound();
  const page = await listPublishedPlaces({ region, size: MAX_PLACES });
  // Lo vacío no existe: una región sin lugares publicados no tiene página (ni llega a Google).
  if (page.items.length === 0) notFound();
  return { region, name: regionName(region)!, places: page.items, total: page.totalElements };
}

export async function generateMetadata(props: PageProps<"/lugares/region/[region]">): Promise<Metadata> {
  const { region: slug } = await props.params;
  const { name, total } = await loadRegion(slug);
  const path = `/lugares/region/${slug}`;
  return {
    title: `Lugares para visitar en ${name}`,
    description: `${total} ${total === 1 ? "lugar" : "lugares"} de ${name}, Perú: fotos, historia y cómo llegar.`,
    alternates: { canonical: path },
    openGraph: { locale: "es_PE", title: `Lugares para visitar en ${name}`, url: path },
  };
}

/**
 * «Lugares de Ayacucho»: todos los lugares publicados de una región del Perú.
 * Responde a búsquedas generales («qué visitar en Ayacucho») que ningún post
 * suelto responde, y ayuda a completar los sellos de «Mis viajes». Se arma
 * sola con la región que se elige al crear cada lugar.
 */
export default async function RegionPage(props: PageProps<"/lugares/region/[region]">) {
  const { region: slug } = await props.params;
  const { region, name, places, total } = await loadRegion(slug);
  const others = (await getPlaceRegions().catch(() => [])).filter((r) => r.region !== region);
  const url = `${SITE_URL}/lugares/region/${slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Lugares para visitar en ${name}`,
      url,
      numberOfItems: total,
      itemListElement: places.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/lugares/${p.slug}`, name: p.name })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Lugares", item: `${SITE_URL}/lugares` },
        { "@type": "ListItem", position: 3, name, item: url },
      ],
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[760px] pb-10 sm:px-4 sm:pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Ruta" className="px-4 pt-4 text-sm text-muted sm:px-0">
        <Link href="/" className="hover:underline">
          Inicio
        </Link>{" "}
        ›{" "}
        <Link href="/lugares" className="hover:underline">
          Lugares
        </Link>{" "}
        › <span className="text-foreground">{name}</span>
      </nav>
      <header className="px-4 pt-2 pb-5 sm:px-0">
        <h1 className="text-3xl leading-tight font-black text-foreground">Lugares para visitar en {name}</h1>
        <p className="mt-1 text-muted">
          {total} {total === 1 ? "lugar" : "lugares"} de {name}, Perú. Toca «Ya fui» en cada uno para ganar el sello de la región.
        </p>
      </header>

      <ul className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 sm:gap-1">
        {places.map((place, index) => (
          <li key={place.id}>
            <GridTile item={fromPlaceSummary(place)} priority={index === 0} />
            <p className="truncate px-1 pt-1 pb-2 text-sm font-semibold text-foreground">{place.name}</p>
          </li>
        ))}
      </ul>

      {others.length > 0 && (
        <section aria-labelledby="otras-regiones" className="mt-10 px-4 sm:px-0">
          <h2 id="otras-regiones" className="text-lg font-bold text-foreground">
            Otras regiones
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((r) => (
              <li key={r.region}>
                <Link
                  href={`/lugares/region/${regionSlug(r.region)}`}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-canvas-strong px-4 text-sm font-semibold text-foreground hover:bg-accent-soft"
                >
                  {regionName(r.region)} <span className="text-muted tabular-nums">{r.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
