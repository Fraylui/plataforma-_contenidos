import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "@phosphor-icons/react/dist/ssr";
import { getPlaceRegions, listPublishedPlaces } from "@/lib/api/client";
import { fromPlaceSummary } from "@/lib/home-items";
import { regionFromSlug, regionName, regionSlug } from "@/lib/peru-regions";
import { SITE_URL } from "@/lib/site-url";
import { CoverImage } from "@/components/region/cover-image";
import { RegionPlaceCard } from "@/components/region/region-place-card";
import { RegionStampBadge } from "@/components/passport/region-stamp-badge";

/** Tope de lugares por página de región (si una región pasa de esto, se agrega paginación). */
const MAX_PLACES = 60;

async function loadRegion(slug: string) {
  const region = regionFromSlug(slug);
  if (!region) notFound();
  const page = await listPublishedPlaces({ region, size: MAX_PLACES });
  // Lo vacío no existe: una región sin lugares publicados no tiene página (ni llega a Google).
  if (page.items.length === 0) notFound();
  return { region, name: regionName(region)!, places: page.items.map(fromPlaceSummary), total: page.totalElements };
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
 * Portada con la foto de uno de sus lugares, el sello de la región de «Mis
 * viajes» y tarjetas grandes de cada lugar. Responde a búsquedas generales
 * («qué visitar en Ayacucho») que ningún post suelto responde. Se arma sola
 * con la región que se elige al crear cada lugar.
 */
export default async function RegionPage(props: PageProps<"/lugares/region/[region]">) {
  const { region: slug } = await props.params;
  const { region, name, places, total } = await loadRegion(slug);
  const others = (await getPlaceRegions().catch(() => [])).filter((r) => r.region !== region);
  const url = `${SITE_URL}/lugares/region/${slug}`;
  // Portada: el lugar con más «me gusta» (el más representativo para la gente).
  const cover = [...places].sort((a, b) => b.likeCount - a.likeCount)[0];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Lugares para visitar en ${name}`,
      url,
      numberOfItems: total,
      itemListElement: places.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${p.href}`, name: p.title })),
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
    <div className="mx-auto w-full max-w-[920px] pb-12 sm:px-4 sm:pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <header className="relative flex min-h-[340px] flex-col justify-end overflow-hidden bg-canvas-strong sm:min-h-[380px] sm:rounded-card">
        <CoverImage item={cover} sizes="(min-width: 920px) 920px, 100vw" priority />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-black/10" />
        <nav aria-label="Ruta" className="absolute top-4 left-4 text-sm font-medium text-white/85 sm:left-6">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>{" "}
          ›{" "}
          <Link href="/lugares" className="hover:underline">
            Lugares
          </Link>{" "}
          › <span className="text-white">{name}</span>
        </nav>
        <RegionStampBadge region={region} name={name} />
        <div className="relative p-4 sm:p-6">
          <div className="min-w-0 text-white">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-accent-fill px-3 py-1 text-xs font-bold text-accent-foreground">
              <MapPin weight="fill" className="size-3.5" aria-hidden="true" />
              {total} {total === 1 ? "lugar" : "lugares"} · Perú
            </p>
            <h1 className="mt-2 text-3xl leading-tight font-black text-balance sm:text-4xl">Lugares para visitar en {name}</h1>
            <p className="mt-1 text-sm text-white/85">Toca «Ya fui» en cada lugar y gana el sello de {name}.</p>
          </div>
        </div>
      </header>

      {/* Un solo lugar: la tarjeta a todo el ancho, sin hueco al lado. */}
      <ul className={`mt-6 grid grid-cols-1 gap-4 px-4 sm:px-0 ${places.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {places.map((place, index) => (
          <li key={place.id}>
            <RegionPlaceCard item={place} priority={index === 0} />
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
