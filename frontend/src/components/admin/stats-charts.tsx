"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PublicationStatus } from "@/lib/api/types";
import type { DailyCount, PlatformStats, Role } from "@/lib/api/admin-types";
import { publicationStatusLabel } from "@/lib/content-labels";
import { roleLabel } from "@/lib/admin/role-labels";

// Rampa secuencial de un solo tono (naranja de marca), clara -> oscura, la
// última parada calza con --accent (#b3390b, ver globals.css) para que
// "Publicado" se vea igual acá que en cualquier otro badge/botón del sitio.
const PIPELINE_RAMP: Record<PublicationStatus, string> = {
  DRAFT: "#fed7aa",
  SCHEDULED: "#fb923c",
  PUBLISHED: "#b3390b",
  ARCHIVED: "#d4d4d8",
};

const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
};

const AXIS_TICK = { fill: "var(--muted)", fontSize: 12 };

const PIPELINE: PublicationStatus[] = ["DRAFT", "SCHEDULED", "PUBLISHED"];

/** Barra horizontal del flujo de publicación, un tramo por estado, clara -> oscura hacia "Publicado". */
export function PipelineChart({ stats }: { stats: PlatformStats }) {
  const data = PIPELINE.map((status) => ({
    name: publicationStatusLabel(status),
    value: stats.publicationsByStatus[status] ?? 0,
    status,
  })).filter((row) => row.value > 0);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }} barCategoryGap={10}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ fill: "var(--accent-soft)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [value, "Publicaciones"] as [number, string]}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((row) => (
            <Cell key={row.status} fill={PIPELINE_RAMP[row.status]} stroke="var(--border)" strokeWidth={1} />
          ))}
          <LabelList dataKey="value" position="right" style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

const CONTENT_TYPE_ROWS: { label: string; key: keyof Pick<PlatformStats,
  "placesByStatus" | "celebrationsByStatus" | "galleriesByStatus"> }[] = [
  { label: "Lugares", key: "placesByStatus" },
  { label: "Celebraciones", key: "celebrationsByStatus" },
  { label: "Galerías", key: "galleriesByStatus" },
];

type ByStatus = PlatformStats["placesByStatus"];

/**
 * Reparto de un tipo en los tres grupos que usa todo el panel: en el sitio,
 * en preparación (borrador + programado) y archivado. Antes lo archivado se
 * sumaba como «pendiente» y no cuadraba con «En preparación».
 */
function splitByStatus(byStatus: ByStatus) {
  const published = byStatus.PUBLISHED ?? 0;
  const preparing = (byStatus.DRAFT ?? 0) + (byStatus.SCHEDULED ?? 0);
  const archived = byStatus.ARCHIVED ?? 0;
  return { published, preparing, archived, total: published + preparing + archived };
}

/** Cada tipo de contenido en sus tres grupos — barra apilada, mismo total real. */
export function ContentTypesChart({ stats }: { stats: PlatformStats }) {
  const data = CONTENT_TYPE_ROWS.map(({ label, key }) => ({ name: label, ...splitByStatus(stats[key]) })).filter(
    (row) => row.total > 0,
  );

  if (data.length === 0) {
    return <p className="mt-3 text-sm text-muted">Todavía no hay contenido en estos formatos.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(140, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 0 }} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={90} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <Tooltip
          cursor={{ fill: "var(--accent-soft)" }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
        />
        <Bar dataKey="published" name="En el sitio" stackId="s" fill="var(--accent)" maxBarSize={18} />
        <Bar dataKey="preparing" name="En preparación" stackId="s" fill="var(--muted)" maxBarSize={18} />
        <Bar dataKey="archived" name="Archivado" stackId="s" fill="var(--border)" maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const ROLE_ORDER: Role[] = ["OWNER", "WORKER"];

/** Conteo de usuarios por rol — una sola serie, sin necesidad de distinguir identidad por color. */
export function RoleChart({ usersByRole }: { usersByRole: Record<Role, number> }) {
  const data = ROLE_ORDER
    .filter((role) => (usersByRole[role] ?? 0) > 0)
    .map((role) => ({ name: roleLabel(role), value: usersByRole[role] ?? 0 }));

  if (data.length === 0) {
    return <p className="mt-3 text-sm text-muted">Sin usuarios registrados.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }} barCategoryGap={10}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={110} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <Tooltip
          cursor={{ fill: "var(--accent-soft)" }}
          contentStyle={TOOLTIP_STYLE}
          formatter={(value) => [value, "Usuarios"] as [number, string]}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
        />
        <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} maxBarSize={18}>
          <LabelList dataKey="value" position="right" style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Días UTC del backend (T00:00:00Z): en la zona del navegador cada barra caía en el día anterior.
const TREND_DATE_FORMAT = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });
const TREND_DATE_FORMAT_LONG = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

/**
 * Tendencia de publicaciones día a día (últimos 30 días) — el único gráfico
 * del panel con eje temporal real, en vez de las barras "estado actual" del
 * resto. Un solo tono (--accent) con relleno degradado: una serie no
 * necesita distinguir identidad por color, solo mostrar la forma.
 */
export function PublishTrendChart({ data }: { data: DailyCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({ ...d, label: TREND_DATE_FORMAT.format(new Date(`${d.date}T00:00:00Z`)) }));

  if (total === 0) {
    return <p className="mt-3 text-sm text-muted">Todavía no se publicó nada en los últimos 30 días.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="publishTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis hide allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          contentStyle={TOOLTIP_STYLE}
          labelFormatter={(_, payload) => {
            const date = payload?.[0]?.payload?.date as string | undefined;
            return date ? TREND_DATE_FORMAT_LONG.format(new Date(`${date}T00:00:00Z`)) : "";
          }}
          formatter={(value) => [value, "Publicadas"] as [number, string]}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#publishTrendFill)"
          activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Publicado vs. pendiente en TODO el contenido (los 5 tipos sumados) — el
 * mismo par accent/border que ya usa ContentTypesChart por tipo, acá como
 * una sola dona para el total. Nada de una paleta de 5 colores por tipo:
 * el sitio reserva el color para --accent, no para identidad categórica.
 */
export function TotalDistributionDonut({ stats }: { stats: PlatformStats }) {
  const rows = [
    stats.publicationsByStatus,
    stats.placesByStatus,
    stats.celebrationsByStatus,
    stats.galleriesByStatus,
  ];
  const sum = rows.map(splitByStatus).reduce((acc, split) => ({
    published: acc.published + split.published,
    preparing: acc.preparing + split.preparing,
    archived: acc.archived + split.archived,
    total: acc.total + split.total,
  }));
  const total = sum.total;

  if (total === 0) {
    return <p className="mt-3 text-sm text-muted">Todavía no hay contenido cargado.</p>;
  }

  const data = [
    { name: "En el sitio", value: sum.published, color: "var(--accent)" },
    { name: "En preparación", value: sum.preparing, color: "var(--muted)" },
    { name: "Archivado", value: sum.archived, color: "var(--border)" },
  ].filter((row) => row.value > 0);

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={72} paddingAngle={data.length > 1 ? 3 : 0} stroke="var(--surface)" strokeWidth={2}>
            {data.map((row) => (
              <Cell key={row.name} fill={row.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value, name) => [value, name] as [number, string]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-foreground">{total}</span>
        <span className="text-[11px] text-muted">contenidos en total</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
        {data.map((row) => (
          <span key={row.name} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: row.color }} aria-hidden="true" />
            {row.name} · {row.value}
          </span>
        ))}
      </div>
    </div>
  );
}
