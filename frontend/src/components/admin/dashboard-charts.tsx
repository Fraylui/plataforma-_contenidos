"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const DATE_SHORT = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });
const DATE_LONG = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const NUMBER = new Intl.NumberFormat("es-PE");

function dayDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/**
 * Minigráfico de una tarjeta de indicador: una sola serie en --accent, sin
 * ejes ni tooltip (la cifra grande y la variación ya están en la tarjeta;
 * esto solo muestra la forma). Decorativo para lectores de pantalla.
 */
export function Sparkline({ values }: { values: number[] }) {
  if (values.every((v) => v === 0)) return <div className="h-10" aria-hidden="true" />;
  const data = values.map((value, i) => ({ i, value }));
  return (
    <div className="h-10" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        {/* Decorativo: sin la capa de teclado de Recharts (tabindex=0), que dejaría foco dentro de algo oculto. */}
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }} accessibilityLayer={false}>
          <YAxis hide domain={[0, "dataMax"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            fill="var(--accent-soft)"
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Una métrica por día (visitas o me gusta) — una sola serie, un solo eje,
 * sin leyenda (el título de la tarjeta la nombra). Tooltip con línea guía.
 */
export function DailyAreaChart({ data, label }: { data: { day: string; value: number }[]; label: string }) {
  const chartData = data.map((d) => ({ ...d, tick: DATE_SHORT.format(dayDate(d.day)) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
        <XAxis
          dataKey="tick"
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          interval="preserveStartEnd"
          minTickGap={32}
        />
        <YAxis
          allowDecimals={false}
          width={40}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ stroke: "var(--muted)", strokeWidth: 1, strokeDasharray: "3 3" }}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--foreground)",
          }}
          labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
          labelFormatter={(_, payload) => {
            const day = payload?.[0]?.payload?.day as string | undefined;
            return day ? DATE_LONG.format(dayDate(day)) : "";
          }}
          formatter={(value) => [NUMBER.format(Number(value)), label] as [string, string]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="var(--accent-soft)"
          activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2, fill: "var(--accent)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
