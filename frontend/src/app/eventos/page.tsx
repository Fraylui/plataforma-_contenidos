import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedEvents } from "@/lib/api/client";
import { EventCard } from "@/components/event/event-card";
import { Pagination } from "@/components/ui/pagination";

const PAGE_SIZE = 24;

const WHEN_TABS: { value: "upcoming" | "past"; label: string }[] = [
  { value: "upcoming", label: "Próximos" },
  { value: "past", label: "Pasados" },
];

export const metadata: Metadata = {
  title: "Eventos",
  description: "Eventos próximos y pasados de la región.",
};

function buildHref(when: "upcoming" | "past", page: number): string {
  const params = new URLSearchParams({ when });
  if (page > 0) params.set("page", String(page));
  return `/eventos?${params.toString()}`;
}

export default async function EventsPage(props: PageProps<"/eventos">) {
  const { when: whenParam, page: pageParam } = await props.searchParams;
  const when = whenParam === "past" ? "past" : "upcoming";
  const page = typeof pageParam === "string" ? Math.max(0, parseInt(pageParam, 10) || 0) : 0;

  const result = await listPublishedEvents({ when, page, size: PAGE_SIZE });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground sm:text-4xl">Eventos</h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Ferias, festivales y actividades — próximas y pasadas.
        </p>
      </header>

      <nav aria-label="Filtrar por fecha" className="mt-6 flex gap-2">
        {WHEN_TABS.map((tab) => {
          const active = tab.value === when;
          return (
            <Link
              key={tab.value}
              href={buildHref(tab.value, 0)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-accent text-accent-foreground" : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <section className="mt-8" aria-label="Eventos">
        {result.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-16 text-center text-sm text-muted">
            {when === "upcoming" ? "Todavía no hay eventos próximos." : "Todavía no hay eventos pasados."}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {result.items.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <Pagination page={result.page} totalPages={result.totalPages} buildHref={(p) => buildHref(when, p)} />
          </>
        )}
      </section>
    </div>
  );
}
