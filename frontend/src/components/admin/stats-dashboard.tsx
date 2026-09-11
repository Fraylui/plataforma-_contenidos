import type { PlatformStats } from "@/lib/api/admin-types";
import type { ArticleStatus } from "@/lib/api/types";
import { articleStatusLabel } from "@/lib/content-labels";
import { AdminPageHeader } from "@/components/admin/ui";
import { ContentTypesChart, PipelineChart, RoleChart } from "@/components/admin/stats-charts";

// Orden real del flujo editorial (CONTEXTO.md sección 12) — la "línea de
// producción". ARCHIVED/REJECTED son estados terminales fuera de la línea
// activa, no un paso más: se muestran aparte para no romper la proporción
// de la barra con contenido que ya salió de circulación.
const PIPELINE: ArticleStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED"];
const OFF_LINE: ArticleStatus[] = ["ARCHIVED", "REJECTED"];

function todayDateline(): string {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function StatsDashboard({ stats }: { stats: PlatformStats }) {
  const pipelineTotal = PIPELINE.reduce((sum, status) => sum + (stats.articlesByStatus[status] ?? 0), 0);
  const inProgress = pipelineTotal - stats.articlesByStatus.PUBLISHED;
  const dateline = todayDateline();

  return (
    <div className="max-w-4xl">
      <AdminPageHeader title="Estadísticas" description={dateline.replace(/^./, (c) => c.toUpperCase())} />

      {/* Cifras destacadas, tabulares — sin íconos: el número es el protagonista. */}
      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <EditionFigure label="Publicados" value={stats.articlesByStatus.PUBLISHED} />
        <EditionFigure label="Últimos 30 días" value={stats.articlesPublishedLast30Days} />
        <EditionFigure label="En preparación" value={inProgress} />
        <EditionFigure label="Usuarios activos" value={stats.activeUsers} />
      </dl>

      {/* La firma de la página: el flujo de publicación como gráfico de barras, clara -> oscura hacia "Publicado". */}
      <section className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Flujo de publicación</h2>

        {pipelineTotal === 0 ? (
          <p className="mt-3 text-sm text-muted">Todavía no hay publicaciones en curso.</p>
        ) : (
          <div className="mt-3">
            <PipelineChart stats={stats} />
          </div>
        )}

        {/* Fuera de línea: estados terminales, aparte de la proporción activa. */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          {OFF_LINE.map((status) => (
            <span key={status}>
              {articleStatusLabel(status)}{" "}
              <span
                className={`tabular-nums font-medium ${status === "REJECTED" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}
              >
                {stats.articlesByStatus[status] ?? 0}
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* Los otros 5 tipos de contenido — sin esto, Estadísticas parecía la de un blog de solo artículos. */}
      <section className="mt-6 rounded-lg border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Otros formatos</h2>
        <ContentTypesChart stats={stats} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Alcance</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <IndexRow label="Categorías activas" value={`${stats.activeCategories} / ${stats.totalCategories}`} />
            <IndexRow label="Etiquetas" value={stats.totalTags} />
            <IndexRow
              label="Unidades geográficas activas"
              value={`${stats.activeGeographyUnits} / ${stats.totalGeographyUnits}`}
            />
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Equipo</h2>
          <RoleChart usersByRole={stats.usersByRole} />
        </section>
      </div>
    </div>
  );
}

function EditionFigure({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-4 shadow-sm">
      <dd className="text-3xl font-semibold tabular-nums text-foreground">{value}</dd>
      <dt className="mt-1 text-xs tracking-wide text-muted uppercase">{label}</dt>
    </div>
  );
}

function IndexRow({ label, value }: { label: string; value: string | number }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="text-foreground">{label}</span>
      <span className="h-px flex-1 border-b border-dotted border-border" aria-hidden="true" />
      <span className="tabular-nums font-medium text-foreground">{value}</span>
    </li>
  );
}
