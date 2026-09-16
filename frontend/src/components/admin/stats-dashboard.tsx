import { Compass, GitBranch, LayoutGrid, Users2 } from "lucide-react";
import type { PlatformStats } from "@/lib/api/admin-types";
import type { ArticleStatus } from "@/lib/api/types";
import { articleStatusLabel } from "@/lib/content-labels";
import { AdminPageHeader } from "@/components/admin/ui";
import { ContentTypesChart, PipelineChart, RoleChart } from "@/components/admin/stats-charts";

const CARD_CLASS = "rounded-xl border border-border/60 bg-surface p-5 transition-colors hover:border-accent/40";
const SECTION_TITLE_CLASS = "flex items-center gap-2 text-xs font-semibold tracking-wide text-muted uppercase";

// Orden real del flujo de publicación (CONTEXTO.md sección 12) — la "línea de
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
      <section className={`mt-8 ${CARD_CLASS}`}>
        <h2 className={SECTION_TITLE_CLASS}>
          <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
          Flujo de publicación
        </h2>

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
                className={`tabular-nums font-medium ${status === "REJECTED" ? "text-danger" : "text-foreground"}`}
              >
                {stats.articlesByStatus[status] ?? 0}
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* Los otros 5 tipos de contenido — sin esto, Estadísticas parecía la de un blog de solo artículos. */}
      <section className={`mt-6 ${CARD_CLASS}`}>
        <h2 className={SECTION_TITLE_CLASS}>
          <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
          Otros formatos
        </h2>
        <ContentTypesChart stats={stats} />
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <section className={CARD_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>
            <Compass className="h-3.5 w-3.5" aria-hidden="true" />
            Alcance
          </h2>
          <ul className="mt-4 space-y-4">
            <RatioRow label="Categorías activas" active={stats.activeCategories} total={stats.totalCategories} />
          </ul>
        </section>

        <section className={CARD_CLASS}>
          <h2 className={SECTION_TITLE_CLASS}>
            <Users2 className="h-3.5 w-3.5" aria-hidden="true" />
            Equipo
          </h2>
          <RoleChart usersByRole={stats.usersByRole} />
        </section>
      </div>
    </div>
  );
}

function EditionFigure({ label, value }: { label: string; value: number }) {
  return (
    <div className={CARD_CLASS}>
      <dd className="text-3xl font-bold tracking-tight tabular-nums text-foreground">{value}</dd>
      <dt className="mt-1.5 text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
    </div>
  );
}

/** Fila con barra de progreso real (activo/total) — reemplaza la línea punteada de índice impreso. */
function RatioRow({ label, active, total }: { label: string; active: number; total: number }) {
  const pct = total > 0 ? Math.round((active / total) * 100) : 0;
  return (
    <li>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="tabular-nums font-semibold text-foreground">
          {active} <span className="font-normal text-muted">/ {total}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}
