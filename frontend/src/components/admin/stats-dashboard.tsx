import type { PlatformStats, Role } from "@/lib/api/admin-types";
import type { ArticleStatus } from "@/lib/api/types";
import { articleStatusLabel } from "@/lib/content-labels";
import { roleLabel } from "@/lib/admin/role-labels";
import { AdminPageHeader } from "@/components/admin/ui";

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

// Los otros 5 tipos de contenido (CONTEXTO.md sección 3) además de Artículo
// — hasta esta revisión, invisibles en Estadísticas aunque el backend ya
// los devolvía (PlatformStatsResponse.java).
const OTHER_CONTENT_TYPES: { label: string; key: keyof Pick<PlatformStats,
  "placesByStatus" | "eventsByStatus" | "galleriesByStatus" | "reviewsByStatus" | "businessesByStatus"> }[] = [
  { label: "Lugares", key: "placesByStatus" },
  { label: "Eventos", key: "eventsByStatus" },
  { label: "Galerías", key: "galleriesByStatus" },
  { label: "Reseñas", key: "reviewsByStatus" },
  { label: "Directorio", key: "businessesByStatus" },
];

function totalOf(byStatus: Record<ArticleStatus, number>): number {
  return Object.values(byStatus).reduce((sum, count) => sum + count, 0);
}

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
        <EditionFigure label="En redacción" value={inProgress} />
        <EditionFigure label="Usuarios activos" value={stats.activeUsers} />
      </dl>

      {/* La firma de la página: la línea editorial como barra de producción, no un donut genérico. */}
      <section className="mt-8 rounded-lg border border-border bg-surface p-6 shadow-sm">
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
                  <span className="tabular-nums font-medium text-foreground">{stats.articlesByStatus[status] ?? 0}</span>
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
        <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {OTHER_CONTENT_TYPES.map(({ label, key }) => {
            const byStatus = stats[key];
            const published = byStatus.PUBLISHED ?? 0;
            const total = totalOf(byStatus);
            return <IndexRow key={key} label={label} value={`${published} / ${total}`} />;
          })}
        </ul>
        <p className="mt-2 text-xs text-muted">Publicados / total.</p>
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
          <RoleRoster usersByRole={stats.usersByRole} />
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
            <span className="w-6 shrink-0 text-right tabular-nums font-medium text-foreground">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}
