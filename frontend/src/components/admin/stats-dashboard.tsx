import type { PlatformStats, Role } from "@/lib/api/admin-types";
import type { ArticleStatus } from "@/lib/api/types";
import { articleStatusLabel } from "@/lib/content-labels";
import { roleLabel } from "@/lib/admin/role-labels";

// Orden real del flujo editorial (CONTEXTO.md sección 12) — la "línea de
// producción". ARCHIVED/REJECTED son estados terminales fuera de la línea
// activa, no un paso más: se muestran aparte para no romper la proporción
// de la barra con contenido que ya salió de circulación.
const PIPELINE: ArticleStatus[] = ["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED"];
const OFF_LINE: ArticleStatus[] = ["ARCHIVED", "REJECTED"];

// Intensidad del acento creciente hacia "publicado" — la tinta se asienta a
// medida que el contenido avanza hacia la imprenta. Un solo tono, sin
// colores nuevos.
const PIPELINE_INTENSITY: Record<string, string> = {
  DRAFT: "bg-accent/20",
  IN_REVIEW: "bg-accent/40",
  APPROVED: "bg-accent/60",
  SCHEDULED: "bg-accent/80",
  PUBLISHED: "bg-accent",
};

const ROLE_ORDER: Role[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR", "MODERATOR", "COLLABORATOR", "USER"];

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
      <header className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
        <h1 className="font-serif text-2xl font-medium text-foreground">Estadísticas</h1>
        <p className="text-xs tracking-wide text-muted uppercase first-letter:capitalize">Cierre de edición · {dateline}</p>
      </header>

      {/* Cifras destacadas, cifras serif tabulares — sin íconos: el número es el protagonista. */}
      <dl className="mt-8 grid grid-cols-2 divide-x divide-border border-y border-border sm:grid-cols-4">
        <EditionFigure label="Publicados" value={stats.articlesByStatus.PUBLISHED} />
        <EditionFigure label="Últimos 30 días" value={stats.articlesPublishedLast30Days} />
        <EditionFigure label="En redacción" value={inProgress} />
        <EditionFigure label="Usuarios activos" value={stats.activeUsers} />
      </dl>

      {/* La firma de la página: la línea editorial como barra de producción, no un donut genérico. */}
      <section className="mt-10">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Línea editorial</h2>

        {pipelineTotal === 0 ? (
          <p className="mt-3 text-sm text-muted">Todavía no hay artículos en producción.</p>
        ) : (
          <>
            <div className="mt-3 flex h-8 w-full overflow-hidden rounded-sm border border-border" role="img"
              aria-label={`Distribución editorial: ${PIPELINE.map((s) => `${articleStatusLabel(s)} ${stats.articlesByStatus[s] ?? 0}`).join(", ")}`}>
              {PIPELINE.map((status) => {
                const count = stats.articlesByStatus[status] ?? 0;
                if (count === 0) return null;
                return (
                  <div
                    key={status}
                    className={`${PIPELINE_INTENSITY[status]} h-full`}
                    style={{ width: `${(count / pipelineTotal) * 100}%` }}
                    title={`${articleStatusLabel(status)}: ${count}`}
                  />
                );
              })}
            </div>

            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {PIPELINE.map((status) => (
                <li key={status} className="flex items-center gap-2 text-muted">
                  <span className={`h-2.5 w-2.5 rounded-full ${PIPELINE_INTENSITY[status]}`} aria-hidden="true" />
                  {articleStatusLabel(status)}
                  <span className="font-serif tabular-nums text-foreground">{stats.articlesByStatus[status] ?? 0}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Fuera de línea: estados terminales, aparte de la proporción activa. */}
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          {OFF_LINE.map((status) => (
            <span key={status}>
              {articleStatusLabel(status)}{" "}
              <span
                className={`font-serif tabular-nums ${status === "REJECTED" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}
              >
                {stats.articlesByStatus[status] ?? 0}
              </span>
            </span>
          ))}
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
        {/* Índice, al estilo de la caja de sumario de un diario: etiqueta — guía de puntos — valor. */}
        <section>
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

        {/* Redacción: staff por rol, como el colofón de una edición impresa. */}
        <section>
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Redacción</h2>
          <RoleRoster usersByRole={stats.usersByRole} />
        </section>
      </div>
    </div>
  );
}

function EditionFigure({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-4 py-4 first:pl-0 last:pr-0">
      <dd className="font-serif text-3xl font-medium tabular-nums text-foreground">{value}</dd>
      <dt className="mt-1 text-xs tracking-wide text-muted uppercase">{label}</dt>
    </div>
  );
}

function IndexRow({ label, value }: { label: string; value: string | number }) {
  return (
    <li className="flex items-baseline gap-2">
      <span className="text-foreground">{label}</span>
      <span className="h-px flex-1 border-b border-dotted border-border" aria-hidden="true" />
      <span className="font-serif tabular-nums text-foreground">{value}</span>
    </li>
  );
}

function RoleRoster({ usersByRole }: { usersByRole: Record<Role, number> }) {
  const roles = ROLE_ORDER.filter((role) => (usersByRole[role] ?? 0) > 0);
  const max = Math.max(...roles.map((role) => usersByRole[role] ?? 0), 1);

  if (roles.length === 0) {
    return <p className="mt-3 text-sm text-muted">Sin usuarios registrados.</p>;
  }

  return (
    <ul className="mt-3 space-y-2.5">
      {roles.map((role) => {
        const count = usersByRole[role] ?? 0;
        return (
          <li key={role} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0 text-foreground">{roleLabel(role)}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-accent"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </span>
            <span className="w-6 shrink-0 text-right font-serif tabular-nums text-foreground">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}
